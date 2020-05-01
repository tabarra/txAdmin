//Requires
const modulename = 'PlayerController';
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);

//Helpers
const now = () => { return Math.round(Date.now() / 1000) };
const anyUndefined = (...args) => { return [...args].some(x => (typeof x === 'undefined')) };


module.exports = class PlayerController {
    constructor(config) {
        logOk('Started');

        //Configs:
        this.config = {};
        // this.config.minSessionTime = 15*60; //15 minutes, in seconds
        this.config.minSessionTime = 1*60; //DEBUG

        //Vars
        this.db = null;
        this.activePlayers = [];
        this.knownIdentifiers = ['steam', 'license', 'xbl', 'live', 'discord', 'fivem'];

        //Start database instance
        (async () => {
            // let dbPath = `${globals.info.serverProfilePath}/data/playersDB.json`;
            let dbPath = `./fakedb.json`;
            try {
                const adapterAsync = new FileAsync(dbPath); //DEBUG
                // const adapterAsync = new FileAsync(dbPath, {
                //     defaultValue: {}, 
                //     serialize: JSON.stringify, 
                //     deserialize: JSON.parse
                // });
                this.db = await low(adapterAsync);
                await this.setupDatabase();
            } catch (error) {
                logError(`Failed to load database file '${dbPath}'`);
                if(GlobalData.verbose) dir(error);
                process.exit();
            }
        })();

        //Cron functions
        setInterval(() => {
            this.processActive();
        }, 15 * 1000); //DEBUG: 15s
    }


    //================================================================
    /**
     * Setup database defaults
     */
    async setupDatabase(){
        /* 
            - `players` table: index by license ID
                - Name (overwrite on every update)
                - tsConnected - Timestamp of join
                - tsLastConnection  - Timestamp of the last connection
                - playTime - Online time counter in minutes
                - Notes {
                    text: string de tamanho máximo a ser definido,
                    lastAdmin: username,
                    tsLastEdit: timestamp,
                }
            - `actions`
                - timestamp
                - IDs array
                - author (the admin name)
                - type [ban|warn|whitelist]
                - message (reason)
        */
        await this.db.defaults({
            version: 1,
            players: [],
            actions: []
        }).write();
        // await this.db.set('players', []).write(); //HACK
    }


    //================================================================
    /**
     * Processes the active players for playtime and saves the database
     */
    async processActive(){
        let writePending = false;
        const unsetKey = {
            id: undefined,
            isTmp: undefined,
            tsConnected: undefined,
            ping: undefined
        }

        try {
            this.activePlayers.forEach(async p => {
                let sessionTime = now() - p.tsConnected;
                //if tsLastConnection = null mudar pra now() ou algo assim

                //If its time to add this player to the database
                if(p.isTmp && sessionTime >= this.config.minSessionTime){
                    writePending = true;
                    p.isTmp = false;
                    p.playTime = Math.round(sessionTime/60);
                    await this.db.get('players')
                        .push(Object.assign({}, p, unsetKey))
                        .value();
                        logOk(`Adding '${p.name}' to players database.`); //DEBUG
                    
                //If its time to update this player's play time
                }else if(!p.isTmp && Math.round(sessionTime/4) % 4 == 0){
                    writePending = true;
                    p.playTime += 1; 
                    await this.db.get("players")
                        .find({license: p.license})
                        .assign(Object.assign({}, p, unsetKey))
                        .value();
                    if(GlobalData.verbose) logOk(`Updating '${p.name}' in players database.`); //DEBUG
                }
            });
        } catch (error) {
            logError(`Failed to process active players array with error: ${error.message}`);
            if(GlobalData.verbose) dir(error);
        }

        try {
            if(writePending) await this.db.write();
        } catch (error) {
            logError(`Failed to save players database with error: ${error.message}`);
            if(GlobalData.verbose) dir(error);
        }
    }


    //================================================================
    /**
     * Searches for a player in the database by the license
     * @param {string} license 
     */
    async getPlayer(license){
        try {
            let p = await this.db.get("players").find({license: license}).value();
            return (typeof p === 'undefined')? null : p;
        } catch (error) {
            if(GlobalData.verbose) logError(`Failed to search for a player in te database with error: ${error.message}`);
            return false;
        }
    }


    //================================================================
    getPlayerList(){
        // just returns playerlist array, probably one this.activePlayers.map()
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
     * 
     * @param {array} players
     */
    async processHeartBeat(players){
        try {
            //Sanity check
            if(!Array.isArray(players)) throw new Error('expected array');
            
            //Validate & filter players then extract ids and license
            let pCount = players.length; //Optimization only, although V8 is probably smart enough
            let hbPlayerLicenses = []; //Optimization + duplicity checking
            let hbPlayers = [];
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
                if(typeof p.license !== 'string' || hbPlayerLicenses.includes(p.license)){
                    invalids++;
                    continue;
                }

                //Add to licenses list
                delete p.endpoint;
                hbPlayerLicenses.push(p.license);
                hbPlayers.push(p);
            }
            if(GlobalData.verbose && invalids) logWarn(`HeartBeat playerlist contained ${invalids} players that were removed.`); 
            

            //Processing active players list, creating the removed list, creating new active list without removed players
            let apCount = this.activePlayers.length;  //Optimization only, although V8 is probably smart enough
            let disconnectedPlayers = []; //might want to do something with this
            let activePlayerIDs = []; //Optimization only
            let newActivePlayers = [];
            for (let i = 0; i < apCount; i++) {
                if(hbPlayerLicenses.includes(this.activePlayers[i].license)){
                    newActivePlayers.push(this.activePlayers[i]);
                    activePlayerIDs.push(this.activePlayers[i].id);
                }else{
                    disconnectedPlayers.push(this.activePlayers[i]); //NOTE: might require a Clone
                }
            }

            //Processing the new players
            for (let hbPI = 0; hbPI < hbPlayers.length; hbPI++) {
                if(!activePlayerIDs.includes(hbPlayers[hbPI].id)){
                    let res = await this.getPlayer(hbPlayers[hbPI].license);
                    if(res){
                        let newPlayer = Object.assign({}, res);
                        newPlayer.tsConnected = now();
                        newPlayer.isTmp = false;
                        newActivePlayers.push(newPlayer);
                    }else{
                        hbPlayers[hbPI].tsConnected = now();
                        hbPlayers[hbPI].isTmp = true;
                        newActivePlayers.push(hbPlayers[hbPI]);
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
