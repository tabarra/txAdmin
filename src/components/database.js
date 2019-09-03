//Requires
const low = require('lowdb')
const FileAsync = require('lowdb/adapters/FileAsync')
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'Database';

//FIXME: experimental database
module.exports = class Database {
    constructor() {
        this.db = null;

        //Start database instance
        (async () => {
            try {
                const adapterAsync = new FileAsync(`${globals.config.serverProfilePath}/data/experimentsDB.json`)
                this.db = await low(adapterAsync);
                this.setDefaults();
            } catch (error) {
                logError(`::Failed to load database file '${globals.config.serverProfilePath}/data/experimentsDB'`, context);
                if(globals.config.verbose) dir(error);
                process.exit();
            }
        })()
    }


    //================================================================
    /**
     * Set defaults
     */
    async setDefaults(){
        this.db.defaults({
            experiments: {
                bans: {
                    enabled: false,
                    banList: []
                }
            }
        }).write()
    }

    //================================================================
    /**
     * Returns the db object
     */
    getDB(){
        return this.db;
    }

} //Fim Database()
