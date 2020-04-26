//Requires
const modulename = 'PlayerController';
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);

//Helpers
const now = () => { return Math.round(Date.now() / 1000) };


module.exports = class PlayerController {
    constructor(config) {
        logOk('Started');

        //Configs:
        this.config = {};
        this.config.minSessionTime = 15*60; //15 minutes, in seconds

        //Vars
        this.db = null;
        this.activePlayers = [];

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
        return;
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

} //Fim Database()
