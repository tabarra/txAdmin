//Requires
const modulename = 'Database';
const fs = require('fs').promises;
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);


//Consts
const BACKUP_INTERVAL = 300e3;
const SAVE_STANDBY = 0;
const SAVE_PRIORITY_LOW = 1;
const SAVE_PRIORITY_MEDIUM = 2;
const SAVE_PRIORITY_HIGH = 3;
const DATABASE_VERSION = 1;
const SAVE_TIMES = [300e3, 58e3, 28e3, 13e3];
// considering a 2 sec skew for the setInterval
// saving every 5 minutes even if nothing changed

//LowDB prod serializer
const ldbProdSerializer = {
    defaultValue: {},
    serialize: JSON.stringify,
    deserialize: JSON.parse,
};
const ldbSerializer = (process.env.APP_ENV === 'webpack') ? ldbProdSerializer : undefined;


/**
 * FIXME: Optimization:
 * https://www.npmjs.com/package/bfj
 * https://www.npmjs.com/package/JSONStream
 * https://www.npmjs.com/package/json-stream-stringify
 *
 * Test:
 * - write a players.json simulating 300k players array
 * - write a standalone code to load lowdb file, filter it once, then write it
 * - execute `/usr/bin/time -v node test.js`
 * - do that with variation of updated lowdb and then using a json stream
 */
class Database {
    constructor(wipePendingWLOnStart) {
        this.dbPath = `${globals.info.serverProfilePath}/data/playersDB.json`;
        this.backupPath = `${globals.info.serverProfilePath}/data/playersDB.backup.json`;
        this.writePending = SAVE_STANDBY;
        this.lastWrite = 0;
        this.obj = null;

        //Start database instance
        this.setupDatabase(wipePendingWLOnStart);

        //Cron functions
        setInterval(() => {
            this.writeDatabase();
        }, SAVE_TIMES[SAVE_PRIORITY_HIGH]);
        setInterval(() => {
            this.backupDatabase();
        }, BACKUP_INTERVAL);
    }


    /**
     * Start lowdb instance and set defaults
     */
    async setupDatabase(wipePendingWLOnStart) {
        //Tries to load the database
        let dbo;
        try {
            const adapterAsync = new FileAsync(this.dbPath, ldbSerializer);
            dbo = await low(adapterAsync);
        } catch (errorMain) {
            logError('Your txAdmin player/actions database could not be loaded.');
            try {
                await fs.copyFile(this.backupPath, this.dbPath);
                const adapterAsync = new FileAsync(this.dbPath, ldbSerializer);
                dbo = await low(adapterAsync);
                logWarn('The database file was restored with the automatic backup file.');
                logWarn('A five minute rollback is expected.');
            } catch (errorBackup) {
                logError('It was also not possible to load the automatic backup file.');
                logError(`Main error: '${errorMain.message}'`);
                logError(`Backup error: '${errorBackup.message}'`);
                logError(`Database path: '${this.dbPath}'`);
                logError('If there is a file in that location, you may try to delete or restore it manually.');
                process.exit();
            }
        }

        //Setting up loaded database
        try {
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
            logError('Failed to setup database object.');
            dir(error);
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
     * Creates a copy of the database file
     */
    async backupDatabase() {
        try {
            await fs.copyFile(this.dbPath, this.backupPath);
            if (GlobalData.verbose) logOk('Database file backed up.');
        } catch (error) {
            logError(`Failed to backup database file '${this.dbPath}'`);
            if (GlobalData.verbose) dir(error);
        }
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
