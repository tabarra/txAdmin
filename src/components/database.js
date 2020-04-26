//Requires
const modulename = 'Database';
const low = require('lowdb')
const FileAsync = require('lowdb/adapters/FileAsync')
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);

//FIXME: experimental database
//NOTE: probably just deprecate this...
module.exports = class Database {
    constructor() {
        this.db = null;

        //Start database instance
        (async () => {
            try {
                const adapterAsync = new FileAsync(`${globals.info.serverProfilePath}/data/experimentsDB.json`)
                this.db = await low(adapterAsync);
                this.setDefaults();
            } catch (error) {
                logError(`Failed to load database file '${globals.info.serverProfilePath}/data/experimentsDB'`);
                if(GlobalData.verbose) dir(error);
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
