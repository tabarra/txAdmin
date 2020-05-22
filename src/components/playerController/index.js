//Requires
const modulename = 'PlayerController';
const clonedeep = require('lodash/clonedeep');
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');
const { customAlphabet } = require('nanoid');
const dict51 = require('nanoid-dictionary/nolookalikes');
const nanoid = customAlphabet(dict51, 10);
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Helpers
const now = () => { return Math.round(Date.now() / 1000) };
const anyUndefined = (...args) => { return [...args].some(x => (typeof x === 'undefined')) };


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
 *      - identifiers [array]
 *      - type [ban|warn|whitelist]
 *      - author (the admin name)
 *      - reason
 *      - timestamp
 *      - revocation: {
 *          timestamp: null,
 *          author: null,
 *      }
 */
module.exports = class PlayerController {
    constructor(config) {
        logOk('Started');

        //Configs:
        this.config = {};
        this.config.minSessionTime = 1*60; //NOTE: use 15 minutes as default
        this.validIdentifiers = {
            steam: /steam:1100001[0-9A-Fa-f]{8}/,
            license: /license:[0-9A-Fa-f]{40}/,
            xbl: /xbl:\d{14,20}/,
            live: /live:\d{14,20}/,
            discord: /discord:\d{7,20}/,
            fivem: /fivem:\d{1,8}/,
        }

        //Vars
        this.dbo = null;
        this.activePlayers = [];
        this.writePending = false;

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
            await this.processActive();

            try {
                if(this.writePending){
                    await this.dbo.write();
                    this.writePending = false;
                    if(GlobalData.verbose) logOk('Writing DB'); //DEBUG
                }
            } catch (error) {
                logError(`Failed to save players database with error: ${error.message}`);
                if(GlobalData.verbose) dir(error);
            }
        }, 15 * 1000);
    }


    //================================================================
    /**
     * Start lowdb instance and set defaults
     */
    async setupDatabase(){
        // let dbPath = `${globals.info.serverProfilePath}/data/playersDB.json`;
        // let dbPath = `./fakedb.json`;
        let dbPath = `${globals.info.serverProfilePath}/data/testDB.json`;
        try {
            const adapterAsync = new FileAsync(dbPath); //DEBUG
            // const adapterAsync = new FileAsync(dbPath, {
            //     defaultValue: {}, 
            //     serialize: JSON.stringify, 
            //     deserialize: JSON.parse
            // });
            this.dbo = await low(adapterAsync);
            await this.dbo.defaults({
                version: 0,
                players: [],
                actions: []
            }).write();
            // await this.dbo.set('players', []).write(); //DEBUG
        } catch (error) {
            logError(`Failed to load database file '${dbPath}'`);
            if(GlobalData.verbose) dir(error);
            process.exit();
        }
    }


    //================================================================
    /**
     * Processes the active players for playtime/sessiontime and sets to the database
     */
    async processActive(){
        try {
            this.activePlayers.forEach(async p => {
                let sessionTime = now() - p.tsConnected;

                //If its time to add this player to the database
                if(p.isTmp && sessionTime >= this.config.minSessionTime){
                    if(p.license == 'deadbeef0000nosave') return; //HACK

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
                    logOk(`Adding '${p.name}' to players database.`); //DEBUG
                    
                //If its time to update this player's play time
                }else if(!p.isTmp && Math.round(sessionTime/4) % 4 == 0){
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
            let p = await this.dbo.get("players").find({license: license}).value();
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
     * TODO: add+test filter
     * 
     * @param {array} idArray identifiers array
     * @param {object} filter lodash-compatible filter object
     * @returns {array|error} array of actions, or, throws on error
     */
    async getRegisteredActions(idArray, filter = {}){
        const clone = require('clone');
        if(!Array.isArray(idArray)) throw new Error('Identifiers should be an array');
        try {
            let actions = await this.dbo.get("actions")
                                .filter(p => idArray.some((fi) => p.identifiers.includes(fi)))
                                .value();
            return clonedeep(actions);
        } catch (error) {
            const msg = `Failed to search for a registered action database with error: ${error.message}`;
            if(GlobalData.verbose) logError(msg);
            throw new Error(msg);
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
     * @returns {string} action ID, or throws if on error or ID not found
     */
    async registerAction(reference, type, author, reason, expiration){
        //Processes target reference
        let identifiers;
        if(Array.isArray(reference)){
            if(!reference.length) throw new Error('You must send at least one identifier');
            let invalids = reference.filter((id)=>{
                return (typeof id !== 'string') || !Object.values(this.validIdentifiers).some(vf => vf.test(id));
            });
            if(invalids.length){
                throw new Error('Invalid identifiers: ' + invalids.join(', '));
            }else{
                identifiers = reference;
            }
        }else if(typeof reference == 'number'){
            let player = this.activePlayers.find((p) => p.id === reference);
            if(!player) throw new Error('player disconnected.');
            if(!player.identifiers.length) throw new Error('player has no identifiers.'); //sanity check
            identifiers = player.identifiers; //FIXME: make sure we are already filtering the identifiers on the processHeartbeat function
        }else{
            throw new Error(`Reference expected to be an array of strings or id. Received '${typeof target}'.`)
        }

        //Saves it to the database
        let actionID = nanoid();
        let toDB = {
            id: actionID,
            type,
            author,
            reason,
            expiration: (typeof expiration == 'number')? expiration : false,
            timestamp: now(),
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
     * @param {string} actionID action id
     * @param {string} author admin name
     * @returns {string} action ID, or throws if ID not found
     */
    async revokeAction(reference, author){
        throw new Error(`not implemented yet ☹`);
    }


    //================================================================
    /**
     * Saves a player notes and returns true/false
     * Usage example: setPlayerNote('xxx', 'super awesome player', 'tabarra')
     * @param {string} license
     * @param {string} note
     * @param {string} author
     * @returns {boolean} 
     */
    async setPlayerNote(license, note, author){
        try {
            //Search player
            let target;
            let ap = globals.playerController.activePlayers.find(p => p.license === license);
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
            this.writePending = true;
            
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
     * FIXME: To prevent retaliation from the gods, consider making the activePlayers a Map instead of an Array.
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
                    //TODO: filter by this.validIdentifiers
                    if(p.identifiers[j].substring(0, 8) == "license:"){
                        p.license = p.identifiers[j].substring(8);
                        break;
                    }
                }

                //Check if license id exist and is not duplicated
                if(typeof p.license !== 'string' || hbPlayers.has(p.license)){
                    invalids++;
                    continue;
                }

                //Add to licenses list
                delete p.endpoint;
                hbPlayers.set(p.license, p)
            }
            if(GlobalData.verbose && invalids) logWarn(`HeartBeat playerlist contained ${invalids} players that were removed.`); 
            

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
                            ping: hbPlayerData.ping,
                            extraData: hbPlayerData.extraData //NOTE: name will probably change, reserve for RolePlay data from frameworks
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
                if(!activePlayerLicenses.includes(player.license)){
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
