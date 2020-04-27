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
        this.config.minSessionTime = 15*60; //15 minutes, in seconds

        //Vars
        this.db = null;
        this.activePlayers = [];
        this.knownIdentifiers = ['steam', 'license', 'xbl', 'live', 'discord', 'fivem'];

        //Start database instance
        (async () => {
            let dbPath = `${globals.info.serverProfilePath}/data/playersDB.json`;
            try {
                const adapterAsync = new FileAsync(dbPath)
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
        }, 15 * 1000);
    }


    //================================================================
    /**
     * Setup database defaults
     */
    async setupDatabase(){
        /* 
            - `players` table: index by license ID
                - Name (overwrite on every update)
                - tsJoined - Timestamp of join
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
            verison: "1.0.0",
            players: [],
            actions: []
        }).write();
    }


    //================================================================
    /**
     * Processes the active players for playtime and saves the database
     */
    async processActive(){
        this.activePlayers.forEach(p => {
            let sessionTime = now() - p.tsConnected;
            if(p.isTmp && sessionTime >= this.config.minSessionTime){
                //remove isTmp
                //add player to the db
            }else if(Math.round(sessionTime/4) % 4 == 0){
                //update nickname
                //add 1 minute
            }
        });

        try {
            //save database
            // if(GlobalData.verbose) log(`Saved player database with ${db.count} members.`);
        } catch (error) {
            logError(`Failed to save players database with error: ${error.message}`);
            if(GlobalData.verbose) dir(error);
        }
    }


    //================================================================
    /**
     * Searches for a player in the database
     * @param {string|array} key 
     */
    async getPlayer(key){
        if(Array.isArray(key)){
            //search player by any id
        }else if(typeof key === 'string'){
            //search player by specific id
        }else{
            throw new Error('getPlayer expects Array or Strings.');
        }
    }

    //================================================================
    getPlayerList(){
        // just returns playerlist array, probably one this.activePlayers.map()
    }

    //================================================================
    //HACK
    async processHeartBeatxxxx(players){
        /*
            TODO:
            - For all removed players = remove from this.activePlayers
            - For all new players:
                - search for it in the database
                - add it to the activePlayers, containing:
                    - some prop to indicate if it already exists in the db
                    - ts_connected

            - For all existing players:
                - IF already on the list -- ???
        
            FIXME:
                - add nickname part
        */
        let newPlayers, removedPlayers, updatedPlayers;
        try {
            newPlayers = players.filter(p => {
                return !this.activePlayers.filter(x => x.id === p.id).length;
            });

            removedPlayers = this.activePlayers.filter(p => {
                return !players.filter(x => x.id === p.id).length;
            });

            updatedPlayers = this.activePlayers.filter(p => {
                return players.filter(x => x.id === p.id).length;
            });
        } catch (error) {
            dir(error)
        }
        dir({
            newPlayers: newPlayers.length,
            removedPlayers: removedPlayers.length,
            updatedPlayers: updatedPlayers.length,
        });

        newPlayers.forEach(p => {
            this.activePlayers.push(p)
        });
    }


    //================================================================
    async processHeartBeat(players){
        
        try {
            /*
                TODO:
                - For all removed players = remove from this.activePlayers
                - For all new players:
                    - search for it in the database
                    - add it to the activePlayers, containing:
                        - some prop to indicate if it already exists in the db
                        - ts_connected
            */
            // let hbPlayerIDs = players.map((p) => p.id);

            //Sanity check
            if(!Array.isArray(players)) throw new Error('expected array');
            
            //Validate & filter players then extract ids and license
            let pCount = players.length; //Optimization only, although V8 is probably smart enough
            let hbPlayerIDs = []; //Optimization only
            let invalids = 0;
            for (let i = 0; i < pCount; i++) {
                const p = players[i];
                //Basic struct
                if(
                    typeof p !== 'object' ||
                    typeof p.name !== 'string' ||
                    typeof p.id !== 'number' ||
                    !Array.isArray(p.identifiers) ||
                    !p.identifiers.length
                ){
                    invalids++;
                    delete players[i];
                }

                //Extract license
                for (let j = 0; j < p.identifiers.length; j++) {
                    const id = p.identifiers[j];
                    //s.substring(0, "test".length) == "test"
                    //either just extract license, or all ids
                }

                //Check if license exists
                // if(xxx){} //TODO:

                //Add to ids list
                hbPlayerIDs.push(p.id);
            }
            if(GlobalData.verbose && invalids) logWarn(`HeartBeat playerlist contained ${invalids} players that were removed.`); 
            
            //TODO: this.knownIdentifiers

            //Processing active players list, removing players that disconnected 
            let apCount = this.activePlayers.length;  //Optimization only, although V8 is probably smart enough
            let disconnectedPlayers = []; //might want to do something with this
            let activePlayerIDs = []; //Optimization only
            for (let apI = 0; apI < apCount; apI++) {
                if(!hbPlayerIDs.includes(this.activePlayers[apI].id)){
                    disconnectedPlayers.push(this.activePlayers[apI]); //NOTE: might require a Clone
                    delete this.activePlayers[apI];
                }else{
                    activePlayerIDs.push(apI)
                }
            }
            
            //Filtering the new players
            let newPlayers = [];
            for (let hbPI = 0; hbPI < players.length; hbPI++) {
                if(!activePlayerIDs.includes(players[hbPI].id)){
                    newPlayers.push(players[hbPI]);
                }
            }
            
            dir({
                disconnectedPlayers: disconnectedPlayers.length,
                newPlayers: newPlayers.length
            });
        } catch (error) {
            dir(error)
        }

    }//Fim processHeartBeat()

} //Fim Database()
