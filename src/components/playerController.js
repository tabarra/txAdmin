//Requires
const modulename = 'PlayerController';
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);

//Helpers
const now = () => { return Math.round(Date.now() / 1000) };
const anyUndefined = (...args) => { return [...args].some(x => (typeof x === 'undefined')) };


/**
 * Provide a central database for players, as well as assist with access control.
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
        this.config.enableDatabase = false; //NOTE: while I'm testing
        this.config.minSessionTime = 1*60; //NOTE: use 15 minutes as default

        //Vars
        this.dbo = null;
        this.activePlayers = [];
        this.knownIdentifiers = ['steam', 'license', 'xbl', 'live', 'discord', 'fivem'];

        //Start database instance
        this.setupDatabase();

        //Cron functions
        setInterval(() => {
            this.processActive();
        }, 15 * 1000);
    }


    //================================================================
    /**
     * Start lowdb instance and set defaults
     */
    async setupDatabase(){
       if(!this.config.enableDatabase) return;

       // let dbPath = `${globals.info.serverProfilePath}/data/playersDB.json`;
       let dbPath = `./fakedb.json`;
       try {
           const adapterAsync = new FileAsync(dbPath); //DEBUG
           // const adapterAsync = new FileAsync(dbPath, {
           //     defaultValue: {}, 
           //     serialize: JSON.stringify, 
           //     deserialize: JSON.parse
           // });
           this.dbo = await low(adapterAsync);
           await this.dbo.defaults({
                version: 1,
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
     * Processes the active players for playtime and saves the database
     */
    async processActive(){
        if(!this.config.enableDatabase) return;
        
        //Goes through each player processing playtime and sessiontime
        let writePending = false;
        try {
            this.activePlayers.forEach(async p => {
                let sessionTime = now() - p.tsConnected;

                //If its time to add this player to the database
                if(p.isTmp && sessionTime >= this.config.minSessionTime){
                    writePending = true;
                    p.isTmp = false;
                    p.playTime = Math.round(sessionTime/60);
                    let toDB = {
                        license: p.license,
                        name: p.name,
                        playTime: p.playTime,
                        tsJoined: p.tsJoined,
                        tsLastConnection: p.tsConnected,
                        notes: null
                    }
                    await this.dbo.get('players')
                        .push(toDB)
                        .value();
                    logOk(`Adding '${p.name}' to players database.`); //DEBUG
                    
                //If its time to update this player's play time
                }else if(!p.isTmp && Math.round(sessionTime/4) % 4 == 0){
                    writePending = true;
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
                    logOk(`Updating '${p.name}' in players database.`); //DEBUG
                }
            });
        } catch (error) {
            logError(`Failed to process active players array with error: ${error.message}`);
            if(GlobalData.verbose) dir(error);
        }

        //Saves the database to the file
        try {
            if(writePending) await this.dbo.write();
        } catch (error) {
            logError(`Failed to save players database with error: ${error.message}`);
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
        if(!this.config.enableDatabase) return false;

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
     * Usage example: getRegisteredAction(['license:xxx'], {type: 'ban', revoked: false})
     * @param {array} idArray identifiers array
     * @param {object} filter lodash-compatible filter object
     * @returns {object|null|false} object if player is found, null if not found, false if error occurs
     */
    async getRegisteredAction(idArray, filter){
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
     * Returns a mostly /players.json compatible playerlist based on the activePlayers
     * 
     * NOTE: ATM only used by the /status endpoint.
     *       Let's try to use just globals.playerController.activePlayers
     * 
     * @returns {array} array of player objects
     */
    getPlayerList(){
        try {
            return this.activePlayers.map(p => {
                return {
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
     * FIXME: To prevent retaliation from the gods, consider making the activePlayers an Map instead of an Array.
     * 
     * @param {array} players
     */
    async processHeartBeat(players){
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
                    //TODO: filter by this.knownIdentifiers
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
            let disconnectedPlayers = []; //NOTE: might want to do something with this
            let activePlayerIDs = []; //Optimization only
            let newActivePlayers = [];
            for (let i = 0; i < apCount; i++) {
                if(hbPlayers.has(this.activePlayers[i].license)){
                    //FIXME:
                    newActivePlayers.push(this.activePlayers[i]);
                    activePlayerIDs.push(this.activePlayers[i].id);
                }else{
                    disconnectedPlayers.push(this.activePlayers[i]); //NOTE: might require a Clone
                }
            }

            //Processing the new players
            for (const [license, player] of hbPlayers) {
                if(!activePlayerIDs.includes(player.id)){
                    let dbPlayer = await this.getPlayer(license);
                    if(dbPlayer){
                        //TODO: create a AllAssocIds for the players, containing all intersecting licenses
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
