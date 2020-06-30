//Requires
const modulename = 'PlayerController';
const humanizeDuration = require('humanize-duration'); //FIXME: remove, this controller is not the right place for interface stuff
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');
const { customAlphabet } = require('nanoid');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Helpers
const now = () => { return Math.round(Date.now() / 1000) };

//Consts
const validActions = ['ban', 'warn', 'whitelist']
const currentDatabaseVersion = 1;


/**
 * Provide a central database for players, as well as assist with access control.
 * 
 * FIXME: separate the player calls to another file somehow
 * 
 * Database Structurure:
 *  - `players` table: index by license ID
 *      - license
 *      - name (overwrite on every update)
 *      - tsLastConnection  - Timestamp of the last connection
 *      - playTime - Online time counter in minutes
 *      - notes {
 *          text: string de tamanho máximo a ser definido,
 *          lastAdmin: username,
 *          tsLastEdit: timestamp,
 *      }
 *  - `actions`
 *      - id [X???-????]
 *      - identifiers [array]
 *      - playerName (player name, or false to imply it was performed on the identifiers only)
 *      - type [ban|warn|whitelist]
 *      - author (the admin name)
 *      - reason
 *      - timestamp
 *      - revocation: {
 *          timestamp: null,
 *          author: null,
 *      }
 *  - `pendingWL`
 *      - id [R####]
 *      - license
 *      - name
 *      - tsLastAttempt
 */
module.exports = class PlayerController {
    constructor(config) {
        logOk('Started');
        this.config = config;
        this.dbo = null;
        this.activePlayers = [];
        this.writePending = false;

        //Config check
        if(this.config.minSessionTime < 1 || this.config.minSessionTime > 60) throw new Error('The playerController.minSessionTime setting must be between 1 and 60 minutes.');

        //Running playerlist generator
        if(
            process.env.APP_ENV !== 'webpack' && 
            GetConvar('txAdminFakePlayerlist', 'false').trim() === 'yesplz'
        ) {
            const PlayerlistGenerator = require('./playerlistGenerator.js');
            this.playerlistGenerator = new PlayerlistGenerator();
        }

        //Start database instance
        this.setupDatabase();

        //Cron functions
        setInterval(async () => {
            //Check if the database is ready
            if(this.dbo === null){
                if(GlobalData.verbose) logWarn('Database still not ready for processing.');
                return;
            }
            await this.processActive();

            try {
                let timeStart = new Date();
                if(this.writePending){
                    await this.dbo.write();
                    this.writePending = false;
                    let timeElapsed = new Date() - timeStart;
                    if(GlobalData.verbose) logOk(`DB file saved, took ${timeElapsed}ms.`); //DEBUG
                }else{
                    // if(GlobalData.verbose) logOk('Nothing to write to DB file');
                }
            } catch (error) {
                logError(`Failed to save players database with error: ${error.message}`);
                if(GlobalData.verbose) dir(error);
            }
        }, 15 * 1000);
    }


    //================================================================
    /**
     * Refresh fxRunner configurations
     */
    refreshConfig(){
        this.config = globals.configVault.getScoped('playerController');
        let cmd = 'txAdmin-checkPlayerJoin ' + (this.config.onJoinCheckBan || this.config.onJoinCheckWhitelist).toString();
        globals.fxRunner.srvCmdBuffer(cmd).then().catch();
    }//Final refreshConfig()


    //================================================================
    /**
     * Start lowdb instance and set defaults
     */
    async setupDatabase(){
        let dbPath = `${globals.info.serverProfilePath}/data/playersDB.json`;
        try {
            let adapterAsync;
            if(process.env.APP_ENV == 'webpack'){
                adapterAsync = new FileAsync(dbPath, {
                    defaultValue: {}, 
                    serialize: JSON.stringify, 
                    deserialize: JSON.parse
                });
            }else{
                adapterAsync = new FileAsync(dbPath);
            }
            let dbo = await low(adapterAsync);
            await dbo.defaults({
                version: currentDatabaseVersion,
                players: [],
                actions: [],
                pendingWL: []
            }).write();

            const importedVersion = await dbo.get('version').value();
            if(importedVersion !== currentDatabaseVersion){
                this.dbo = await this.migrateDB(dbo, importedVersion);
            }else{
                this.dbo = dbo;
            }

            // await this.dbo.set('players', []).write(); //DEBUG
            if(this.config.wipePendingWLOnStart) await this.dbo.set('pendingWL', []).write();
        } catch (error) {
            logError(`Failed to load database file '${dbPath}'`);
            if(GlobalData.verbose) dir(error);
            process.exit();
        }
    }


    //================================================================
    /**
     * Handles the migration of the database
     * @param {object} dbo 
     * @param {string} oldVersion 
     * @returns {object} lodash database
     */
    async migrateDB(dbo, oldVersion){
        if(typeof oldVersion !== 'number'){
            logError(`Your players database version is not a number!`);
            process.exit();
        }
        if(oldVersion < 1){
            logWarn(`Migrating your players database from v${oldVersion} to v1. Wiping all the data.`);
            await dbo.set('version', currentDatabaseVersion)
                .set('players', [])
                .set('actions', [])
                .set('pendingWL', [])
                .write();
        }else{
            logError(`Your players database is on v${oldVersion}, which is different from this version of txAdmin.`);
            logError(`Since there is currently no migration method ready for the migration, txAdmin will attempt to use it anyways.`);
            logError(`Please make sure your txAdmin is on the most updated version!`);
        }
        return dbo;
    }


    //================================================================
    /**
     * Returns the entire lowdb object. Please be careful with it :)
     * 
     * TODO: perhaps add a .cloneDeep()? Mighe cause some performance issues tho
     * 
     * @returns {object} lodash database
     */
    getDB(){
        return this.dbo;
    }


    //================================================================
    /**
     * Processes the active players for playtime/sessiontime and sets to the database
     * 
     * TODO: If this function is called multiple times within the first 15 seconds of an sessionTime minute, 
     *          it will keep adding playTime
     *       Solution: keep an property for tsLastTimeIncremment, and wait for it to be >=60 before playtime++ and reset the ts
     * NOTE: I'm only saving notes every  15 seconds or when the player disconnects.
     */
    async processActive(){
        const checkMinuteElapsed = (time) => {
            return time > 15 && time % 60 < 15;
        }

        try {
            this.activePlayers.forEach(async p => {
                let sessionTime = now() - p.tsConnected;

                //If its time to add this player to the database
                if(p.isTmp && sessionTime >= this.config.minSessionTime){
                    if(p.license == '3333333333333333333333deadbeef0000nosave') return; //DEBUG

                    this.writePending = true;
                    p.isTmp = false;
                    p.playTime = Math.round(sessionTime/60);
                    p.notes = {
                        text: '',
                        lastAdmin: null,
                        tsLastEdit: null
                    }
                    let toDB = {
                        license: p.license,
                        name: p.name,
                        playTime: p.playTime,
                        tsJoined: p.tsJoined,
                        tsLastConnection: p.tsConnected,
                        notes: p.notes
                    }
                    await this.dbo.get('players')
                        .push(toDB)
                        .value();
                    if(GlobalData.verbose) logOk(`Adding '${p.name}' to players database.`);
                    
                //If its time to update this player's play time
                }else if(!p.isTmp && checkMinuteElapsed(sessionTime)){
                    this.writePending = true;
                    p.playTime += 1; 
                    await this.dbo.get("players")
                        .find({license: p.license})
                        .assign({
                            name: p.name, 
                            playTime: p.playTime, 
                            notes: p.notes,
                            tsLastConnection: p.tsConnected
                        })
                        .value();
                    // logOk(`Updating '${p.name}' in players database.`); //DEBUG
                }
            });
        } catch (error) {
            logError(`Failed to process active players array with error: ${error.message}`);
            if(GlobalData.verbose) dir(error);
        }
    }


    //================================================================
    /**
     * Searches for a player in the database by the license
     * @param {string} license 
     * @returns {object|null|false} object if player is found, null if not found, false if error occurs
     */
    async getPlayer(license){
        try {
            let p = await this.dbo.get("players").find({license: license}).cloneDeep().value();
            return (typeof p === 'undefined')? null : p;
        } catch (error) {
            if(GlobalData.verbose) logError(`Failed to search for a player in the database with error: ${error.message}`);
            return false;
        }
    }


    //================================================================
    /**
     * Searches for a registered action in the database by a list of identifiers and optional filters
     * Usage example: getRegisteredActions(['license:xxx'], {type: 'ban', revocation.timestamp: null})
     * 
     * NOTE: I haven't actually benchmarked to make sure passing the filter first increases the performance
     * 
     * @param {array} idArray identifiers array
     * @param {object} filter lodash-compatible filter object
     * @returns {array|error} array of actions, or, throws on error
     */
    async getRegisteredActions(idArray, filter = {}){
        if(!Array.isArray(idArray)) throw new Error('Identifiers should be an array');
        try {
            return await this.dbo.get("actions")
                            .filter(filter)
                            .filter(a => idArray.some((fi) => a.identifiers.includes(fi)))
                            .cloneDeep()
                            .value();
        } catch (error) {
            const msg = `Failed to search for a registered action database with error: ${error.message}`;
            if(GlobalData.verbose) logError(msg);
            throw new Error(msg);
        }
    }


    //================================================================
    /**
     * Processes an playerConnecting validation request
     * 
     * TODO: improve ban message to be more verbose
     * 
     * FIXME: this probably shouldn't be inside playerController
     * 
     * @param {array} idArray identifiers array
     * @param {string} name player name
     * @returns {object} {allow: bool, reason: string}, or throws on error
     */
    async checkPlayerJoin(idArray, playerName){
        //Check if required
        if(!this.config.onJoinCheckBan && !this.config.onJoinCheckWhitelist){
            return {allow: true, reason: 'checks disabled'};
        }

        //Sanity checks
        if(typeof playerName !== 'string') throw new Error('playerName should be an string.');
        if(!Array.isArray(idArray)) throw new Error('Identifiers should be an array with at least 1 identifier.');
        idArray = idArray.filter((id)=>{
            return Object.values(GlobalData.validIdentifiers).some(vf => vf.test(id));
        });

        try {
            //Prepare & query
            let ts = now();
            const filter = (x) => {
                return (
                    (x.type == 'ban' || x.type == 'whitelist') &&
                    (!x.expiration || x.expiration > ts) &&
                    (!x.revocation.timestamp)
                );
            }
            let hist = await this.getRegisteredActions(idArray, filter);

            //Check ban
            if(this.config.onJoinCheckBan){
                let ban = hist.find((a) => a.type == 'ban');
                if(ban){
                    let msg;
                    if(ban.expiration){
                        let humanizeOptions = {
                            language: globals.translator.t('$meta.humanizer_language'),
                            round: true,
                            units: ['d', 'h'],
                        }
                        const expiration = humanizeDuration((ban.expiration - ts)*1050, humanizeOptions);
                        msg = `You have been banned from this server.\n`;
                        msg += `Your ban will expire in: ${expiration}.\n`;
                        msg += `Ban ID: ${ban.id}.`;
                    }else{
                        msg = `You have been permanently banned from this server.\n`;
                        msg += `Ban ID: ${ban.id}.`;
                    }
                    
                    return {allow: false, reason: msg};
                }
            }

            //Check whitelist
            if(this.config.onJoinCheckWhitelist){
                let wl = hist.find((a) => a.type == 'whitelist');
                if(!wl){
                    //Get license
                    let license = idArray.find((id) => id.substring(0, 8) == "license:");
                    if(!license) return {allow: false, reason: 'the whitelist module requires a license identifier.'}
                    license = license.substring(8);
                    //Check for pending WL requests
                    let pending = await this.dbo.get("pendingWL").find({license: license}).value();
                    let whitelistID;
                    if(pending){
                        pending.name = playerName;
                        pending.tsLastAttempt = now();
                        whitelistID = pending.id;
                    }else{
                        whitelistID = 'R' + customAlphabet(GlobalData.noLookAlikesAlphabet, 4)()
                        let toDB = {
                            id: whitelistID,
                            name: playerName,
                            license: license,
                            tsLastAttempt: now()
                        }
                        await this.dbo.get('pendingWL').push(toDB).value();
                    }
                    this.writePending = true;

                    //Clean rejection message
                    const xssRejectMessage = require('../../extras/xss')({
                        strong: [],
                        id: []
                    });
                    let reason = xssRejectMessage(this.config.whitelistRejectionMessage)
                                    .replace(/<\/?strong>/g, '')
                                    .replace(/<id>/g, whitelistID);
                    return {allow: false, reason};
                }
            }

            return {allow: true, reason: null};
        } catch (error) {
            const msg = `Failed to check whitelist/blacklist: ${error.message}`;
            logError(msg);
            if(GlobalData.verbose) dir(error);
            return {allow: false, reason: msg};
        }
    }


    //================================================================
    /**
     * Registers an action (ban, warn, whitelist)
     * @param {array|number} reference identifiers array or server id
     * @param {string} type [ban|warn|whitelist]
     * @param {string} author admin name
     * @param {string} reason reason
     * @param {number|false} expiration reason
     * @param {string|false} playerName the name of the player (for UX purposes only)
     * @returns {string} action ID, or throws if on error or ID not found
     */
    async registerAction(reference, type, author, reason = null, expiration = false, playerName = false){
        //Sanity check
        const timestamp = now();
        if(!validActions.includes(type)) throw new Error('Invalid action type.');
        if(typeof author !== 'string' || !author.length) throw new Error('Invalid author.');
        if(reason !== null && (typeof reason !== 'string' || !reason.length)) throw new Error('Invalid reason.');
        if(expiration !== false && (typeof expiration !== 'number' || expiration < timestamp)) throw new Error('Invalid expiration.');
        if(playerName !== false && (typeof playerName !== 'string' || !playerName.length)) throw new Error('Invalid playerName.');

        //Processes target reference
        let identifiers;
        if(Array.isArray(reference)){
            if(!reference.length) throw new Error('You must send at least one identifier');
            let invalids = reference.filter((id)=>{
                return (typeof id !== 'string') || !Object.values(GlobalData.validIdentifiers).some(vf => vf.test(id));
            });
            if(invalids.length){
                throw new Error('Invalid identifiers: ' + invalids.join(', '));
            }else{
                identifiers = reference;
            }
        }else if(typeof reference == 'number'){
            let player = this.activePlayers.find((p) => p.id === reference);
            if(!player) throw new Error('Player disconnected.');
            if(!player.identifiers.length) throw new Error('Player has no identifiers.'); //sanity check
            identifiers = player.identifiers;
            playerName = player.name;
        }else{
            throw new Error(`Reference expected to be an array of strings or ID int. Received '${typeof target}'.`)
        }

        //Saves it to the database
        let actionPrefix = (type == 'warn')? 'a' : type[0];
        let actionID = actionPrefix.toUpperCase() 
            + customAlphabet(GlobalData.noLookAlikesAlphabet, 3)() 
            + '-' 
            + customAlphabet(GlobalData.noLookAlikesAlphabet, 4)();
        let toDB = {
            id: actionID,
            type,
            author,
            reason,
            expiration,
            timestamp,
            playerName,
            identifiers,
            revocation: {
                timestamp: null,
                author: null,
            }
        }
        try {
            await this.dbo.get('actions')
                .push(toDB)
                .value();
            this.writePending = true;
        } catch (error) {
            let msg = `Failed to register event to database with message: ${error.message}`;
            logError(msg);
            if(GlobalData.verbose) dir(error);
            throw new Error(msg)
        }


        return actionID;
    }


    //================================================================
    /**
     * Revoke an action (ban, warn, whitelist)
     * @param {string} action_id action id
     * @param {string} author admin name
     * @param {array} allowedTypes array containing the types of actions this admin can revoke
     * @returns {string} null, error message string, or throws if something goes wrong
     */
    async revokeAction(action_id, author, allowedTypes=true){
        if(typeof action_id !== 'string' || !action_id.length) throw new Error('Invalid action_id.');
        if(typeof author !== 'string' || !author.length) throw new Error('Invalid author.');
        if(allowedTypes !== true && !Array.isArray(allowedTypes)) throw new Error('Invalid allowedTypes.');
        try {
            let action = await this.dbo.get("actions")
                            .find({id: action_id})
                            .value();
            if(action){
                if(action.type === 'warn') return 'cannot revoke warns'
                if(allowedTypes !== true && !allowedTypes.includes(action.type)){
                    return 'you do not have permission to revoke this action'
                }
                action.revocation = {
                    timestamp: now(),
                    author
                }
                this.writePending = true;
                return null;
            }else{
                return 'action not found';
            }
        } catch (error) {
            let msg = `Failed to revoke action with message: ${error.message}`;
            logError(msg);
            if(GlobalData.verbose) dir(error);
            throw new Error(msg)
        }
    }


    //================================================================
    /**
     * Whitelists a player from its license or wl pending id
     * 
     * NOTE: I'm only getting the first matched pending, but removing all patching
     * NOTE: maybe I should add a trycatch inside here
     * 
     * @param {string} reference "license:" prefixed license or pending id
     * @param {string} author admin name
     * @returns {string} action ID, or throws if ID not found or error
     */
    async approveWhitelist(reference, author){
        //Sanity check & validation
        if(typeof reference !== 'string' || typeof author !== 'string'){
            throw new Error('Reference and Author should be strings');
        }

        //Localizing pending request
        let pendingFilter;
        let saveReference;
        let playerName = false;
        if(/[0-9A-Fa-f]{40}/.test(reference)){
            pendingFilter = {license: reference};
            saveReference = [`license:${reference}`];
            let pending = await this.dbo.get("pendingWL").find(pendingFilter).value();
            if(pending) playerName = pending.name;
        }else if(GlobalData.regexWhitelistReqID.test(reference)){
            pendingFilter = {id: reference};
            let pending = await this.dbo.get("pendingWL").find(pendingFilter).value();
            if(!pending) throw new Error('Pending ID not found in database');
            saveReference = [`license:${pending.license}`];
            playerName = pending.name;
        }else{
            throw new Error('Invalid reference type');
        }

        //Register whitelist
        let actionID = await this.registerAction(saveReference, 'whitelist', author, null, false, playerName);
        if(!actionID) throw new Error('Failed to whitelist player');
        this.writePending = true;

        //Remove from the pending list
        if(playerName){
            await this.dbo.get("pendingWL").remove(pendingFilter).value();
        }

        return actionID;
    }


    //================================================================
    /**
     * Saves a player notes and returns true/false
     * Usage example: setPlayerNote('xxx', 'super awesome player', 'tabarra')
     * 
     * NOTE: Setting writePending here won't do anything. Don't try it...
     * 
     * @param {string} license
     * @param {string} note
     * @param {string} author
     * @returns {boolean} 
     */
    async setPlayerNote(license, note, author){
        try {
            //Search player
            let target;
            let ap = this.activePlayers.find(p => p.license === license);
            if(ap){
                target = ap;
            }else{
                let dbp = await this.dbo.get("players").find({license: license}).value();
                if(!dbp) return false;
                target = dbp;
            }

            //Add note and set pending flag
            target.notes = {
                text: note,
                lastAdmin: author,
                tsLastEdit: now()
            }
            
            return true;
        } catch (error) {
            if(GlobalData.verbose) logError(`Failed to search for a registered action database with error: ${error.message}`);
            return false;
        }
    }


    //================================================================
    /**
     * Returns a mostly /players.json compatible playerlist based on the activePlayers
     * 
     * NOTE: ATM only used by the /status endpoint.
     *       Let's try to use just clone(globals.playerController.activePlayers)
     * 
     * @returns {array} array of player objects
     */
    getPlayerList(){
        try {
            return this.activePlayers.map(p => {
                return {
                    license: p.license,
                    id: p.id,
                    name: p.name,
                    ping: p.ping,
                    identifiers: p.identifiers,
                }
            });
        } catch (error) {
            if(GlobalData.verbose) logError(`Failed to generate playerlist with error: ${error.message}`);
            return false;
        }
    }


    //================================================================
    /**
     * Processes the monitor heartbeat to update internal active playerlist.
     * Macro view of this function:
     *  -For all removed players = remove from this.activePlayers
     *  -For all new players:
     *      - search for them in the db
     *      - add them to the active players containing:
     *          - some prop to indicate if its present in the database
     *          - tsConnected
     * 
     * NOTE:  This code was written this way to improve performance in exchange of readability
     *           the ES6 gods might not like this..
     * TODO: To prevent retaliation from the gods, consider making the activePlayers a Map instead of an Array.
     * 
     * FIXME: I'm guaranteeing there are not two players with the same License, but not ID.
     * 
     * @param {array} players
     */
    async processHeartBeat(players){
        //DEBUG: in case the player generator is enabled
        if(this.playerlistGenerator) players = this.playerlistGenerator.playerlist;

        try {
            //Sanity check
            if(!Array.isArray(players)) throw new Error('expected array');
            
            //Validate & filter players then extract ids and license
            let pCount = players.length; //Optimization only, although V8 is probably smart enough
            let hbPlayers = new Map();
            let invalids = 0;
            let duplicated = 0;
            for (let i = 0; i < pCount; i++) {
                let p = Object.assign({}, players[i]);

                //Basic struct
                if(
                    typeof p !== 'object' ||
                    typeof p.name !== 'string' ||
                    typeof p.id !== 'number' ||
                    typeof p.license !== 'undefined' ||
                    !Array.isArray(p.identifiers) ||
                    !p.identifiers.length
                ){
                    invalids++;
                    continue;
                }

                //Extract license
                for (let j = 0; j < p.identifiers.length; j++) {
                    if(p.identifiers[j].length == 48 && p.identifiers[j].substring(0, 8) == "license:"){
                        p.license = p.identifiers[j].substring(8);
                        break;
                    }
                }

                //Check if license id exist and is not duplicated
                if(typeof p.license !== 'string'){
                    invalids++;
                    continue;
                }
                if(hbPlayers.has(p.license)){
                    duplicated++;
                    continue;
                }

                //Add to licenses list
                delete p.endpoint;
                hbPlayers.set(p.license, p)
            }
            if(GlobalData.verbose && invalids) logWarn(`HeartBeat playerlist contained ${invalids} invalid players that were removed.`); 
            if(GlobalData.verbose && duplicated) logWarn(`HeartBeat playerlist contained ${duplicated} duplicated players that were removed.`); 
            

            //Processing active players list, creating the removed list, creating new active list without removed players
            let apCount = this.activePlayers.length;  //Optimization only, although V8 is probably smart enough
            let disconnectedPlayers = [];
            let activePlayerLicenses = []; //Optimization only
            let newActivePlayers = [];
            for (let i = 0; i < apCount; i++) {
                let hbPlayerData = hbPlayers.get(this.activePlayers[i].license);  
                if(hbPlayerData){
                    let updatedPlayer = Object.assign(
                        this.activePlayers[i], 
                        {
                            id: hbPlayerData.id, //NOTE: possibly the solution to the double player issue?
                            ping: hbPlayerData.ping,
                            // extraData: hbPlayerData.extraData //NOTE: reserve for RolePlay data from frameworks
                        }
                    );
                    newActivePlayers.push(updatedPlayer);
                    activePlayerLicenses.push(this.activePlayers[i].license);
                }else{
                    disconnectedPlayers.push(this.activePlayers[i]);
                }
            }

            //Processing the new players
            for (const [license, player] of hbPlayers) {
                //Make sure we are not adding the same user twice
                if(!activePlayerLicenses.includes(player.license)){
                    //Filter to only valid identifiers
                    player.identifiers = player.identifiers.filter((id)=>{
                        return Object.values(GlobalData.validIdentifiers).some(vf => vf.test(id));
                    });
                    //Check if he is already on the database
                    let dbPlayer = await this.getPlayer(license);
                    if(dbPlayer){
                        //TODO: create a AllAssocIds for the players, containing all intersecting identifiers
                        let newPlayer = Object.assign({}, player, {
                            tsJoined: dbPlayer.tsJoined, 
                            playTime: dbPlayer.playTime, 
                            tsConnected: now(), 
                            isTmp: false,
                            notes: dbPlayer.notes
                        });
                        newActivePlayers.push(newPlayer);
                    }else{
                        let tsNow = now();
                        player.tsJoined = tsNow;
                        player.tsConnected = tsNow;
                        player.isTmp = true;
                        newActivePlayers.push(player);
                    }
                }
            }

            //Committing disconnected players data
            //NOTE: I'm only assigning the notes because that's currently the only thing that can change between saves.
            if(disconnectedPlayers.length) this.writePending = true;
            disconnectedPlayers.forEach(async (p) => {
                try {
                    await this.dbo.get("players")
                        .find({license: p.license})
                        .assign({
                            notes: p.notes,
                        })
                        .value();
                } catch (error) {
                    logError(`Failed to save the the following disconnected player to the database with error: ${error.message}`);
                    dir(p);
                }
            });

            //Replacing the active playerlist
            this.activePlayers = newActivePlayers;
        } catch (error) {
            if(GlobalData.verbose){
                logError(`PlayerController failed to process HeartBeat with error: ${error.message}`);
                dir(error);
            }
        }
    }//Fim processHeartBeat()

} //Fim Database()
