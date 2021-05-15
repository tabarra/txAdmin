//Requires
const modulename = 'Database';
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);


//Consts
const SAVE_STANDBY = 0;
const SAVE_PRIORITY_LOW = 1;
const SAVE_PRIORITY_MEDIUM = 2;
const SAVE_PRIORITY_HIGH = 3;
const DATABASE_VERSION = 1;
const SAVE_TIMES = [300e3, 58e3, 28e3, 13e3];
// considering a 2 sec skew for the setInterval
// saving every 5 minutes even if nothing changed

class Database {
    constructor(wipePendingWLOnStart) {
        this.writePending = SAVE_STANDBY;
        this.lastWrite = 0;
        this.obj = null;

        //Start database instance
        this.setupDatabase(wipePendingWLOnStart);

        //Cron functions
        setInterval(() => {
            this.writeDatabase();
        }, SAVE_TIMES[SAVE_PRIORITY_HIGH]);
    }


    /**
     * Start lowdb instance and set defaults
     */
    async setupDatabase(wipePendingWLOnStart) {
        const dbPath = `${globals.info.serverProfilePath}/data/playersDB.json`;
        try {
            let adapterAsync;
            if (process.env.APP_ENV == 'webpack') {
                adapterAsync = new FileAsync(dbPath, {
                    defaultValue: {},
                    serialize: JSON.stringify,
                    deserialize: JSON.parse,
                });
            } else {
                adapterAsync = new FileAsync(dbPath);
            }
            const dbo = await low(adapterAsync);
            await dbo.defaults({
                version: DATABASE_VERSION,
                players: [],
                actions: [],
                pendingWL: [],
            }).write();

            const importedVersion = await dbo.get('version').value();
            if (importedVersion !== DATABASE_VERSION) {
                this.obj = await this.migrateDB(dbo, importedVersion);
            } else {
                this.obj = dbo;
            }

            // await this.obj.set('players', []).write(); //Wipe players
            if (wipePendingWLOnStart) await this.obj.set('pendingWL', []).write();
            this.lastWrite = Date.now();
        } catch (error) {
            if (error.message.startsWith('Malformed JSON')) {
                logError('Your database file got corrupted and could not be loaded.');
                logError('If you have a backup, you can manually replace the file.');
                logError('If you don\'t care about the contents (players/bans/whitelists), just delete the file.');
                logError('You can also try restoring it manually.');
                logError(`Database path: '${dbPath}'`);
            } else {
                logError(`Failed to load database file '${dbPath}'`);
                if (GlobalData.verbose) dir(error);
            }
            process.exit();
        }
    }


    /**
     * Handles the migration of the database
     * @param {object} dbo
     * @param {string} oldVersion
     * @returns {object} lodash database
     */
    async migrateDB(dbo, oldVersion) {
        if (typeof oldVersion !== 'number') {
            logError('Your players database version is not a number!');
            process.exit();
        }
        if (oldVersion < 1) {
            logWarn(`Migrating your players database from v${oldVersion} to v1. Wiping all the data.`);
            await dbo.set('version', DATABASE_VERSION)
                .set('players', [])
                .set('actions', [])
                .set('pendingWL', [])
                .write();
        } else {
            logError(`Your players database is on v${oldVersion}, which is different from this version of txAdmin.`);
            logError('Since there is currently no migration method ready for the migration, txAdmin will attempt to use it anyways.');
            logError('Please make sure your txAdmin is on the most updated version!');
        }
        return dbo;
    }


    /**
     * Set write pending flag
     * @param {int} flag
     */
    writeFlag(flag = SAVE_PRIORITY_MEDIUM) {
        if (![SAVE_PRIORITY_LOW, SAVE_PRIORITY_MEDIUM, SAVE_PRIORITY_HIGH].includes(flag)) {
            throw new Error('unknown priority flag!');
        }
        if (flag > this.writePending) {
            if (GlobalData.verbose) log(`writeFlag > ${['no', 'low', 'med', 'high'][flag]}`);
            this.writePending = flag;
        }
    }


    /**
     * Writes the database to the disk, taking in consideration the priority flag
     */
    async writeDatabase() {
        //Check if the database is ready
        if (this.obj === null) return;

        const timeStart = Date.now();
        const sinceLastWrite = timeStart - this.lastWrite;

        if (this.writePending === SAVE_PRIORITY_HIGH || sinceLastWrite > SAVE_TIMES[this.writePending]) {
            try {
                await this.obj.write();
                const timeElapsed = Date.now() - timeStart;
                this.writePending = SAVE_STANDBY;
                this.lastWrite = timeStart;
                if (GlobalData.verbose) logOk(`DB file saved, took ${timeElapsed}ms.`);
            } catch (error) {
                logError(`Failed to save players database with error: ${error.message}`);
                if (GlobalData.verbose) dir(error);
            }
        } else {
            if (GlobalData.verbose) logOk('Skipping DB file save.');
        }
    }
} //Fim Database()


module.exports = {
    SAVE_PRIORITY_LOW,
    SAVE_PRIORITY_MEDIUM,
    SAVE_PRIORITY_HIGH,
    Database,
};
