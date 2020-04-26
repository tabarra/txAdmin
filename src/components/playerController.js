//Requires
const modulename = 'PlayerController';
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);


module.exports = class PlayerController {
    constructor() {
        logOk('Started');

        this.db = null;
        this.activePlayers = []
    }


    //================================================================
    /**
     * Setup database defaults
     */
    async setupDatabase(){
        /* 
            - `players` table: index by license ID
                - Name (overwrite on every update)
                - Last connection timestamp
                - Notes
                - Online time counter
            - `ids_events`
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
        }).write()
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
    async processHeartBeat(players){
        /*
            newPlayers = players.filter(p => {
                return !cachedPlayers.filter(x => x.id === p.id).length;
            });
            
            removedPlayers = cachedPlayers.filter(p => {
                return !players.filter(x => x.id === p.id).length;
            });
        */

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
        // dir({
        //     newPlayers: newPlayers.length,
        //     removedPlayers: removedPlayers.length,
        //     updatedPlayers: updatedPlayers.length,
        // });

        newPlayers.forEach(p => {
            this.activePlayers.push(p)
        });
    }

} //Fim Database()
