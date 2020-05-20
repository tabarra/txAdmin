//Requires
const modulename = 'PlayerController';
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');
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
 *      - timestamp
 *      - IDs array
 *      - author (the admin name)
 *      - type [ban|warn|whitelist]
 *      - message (reason)    
 */
module.exports = class PlayerController {
    constructor(config) {
        logOk('Started');

        //Configs:
        this.config = {};
        this.config.minSessionTime = 1*60; //NOTE: use 15 minutes as default
        this.validIdentifiers = ['steam', 'license', 'xbl', 'live', 'discord', 'fivem'];

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
     * Usage example: getRegisteredActions(['license:xxx'], {type: 'ban', revoked: false})
     * @param {array} idArray identifiers array
     * @param {object} filter lodash-compatible filter object
     * @returns {object|null|false} object if player is found, null if not found, false if error occurs
     */
    async getRegisteredActions(idArray, filter){
        try {
            let p = await this.dbo.get("players").find({license: license}).value();
            return (typeof p === 'undefined')? null : p;
        } catch (error) {
            if(GlobalData.verbose) logError(`Failed to search for a registered action database with error: ${error.message}`);
            return false;
        }
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
