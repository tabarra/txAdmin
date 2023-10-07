const modulename = 'Database';
import fsp from 'node:fs/promises';
import { ExpChain } from 'lodash';
import lodash from 'lodash-es';
import { Low, Adapter } from 'lowdb';
import { TextFile } from 'lowdb/node';
import { convars } from '@core/globalData';
import { DatabaseDataType } from './databaseTypes.js';
import migrations from './migrations.js';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);

//Consts & helpers
export const DATABASE_VERSION = 4;
export const defaultDatabase = {
    version: DATABASE_VERSION,
    players: [],
    actions: [],
    whitelistApprovals: [],
    whitelistRequests: [],
};

export const SAVE_PRIORITY_LOW = 1;
export const SAVE_PRIORITY_MEDIUM = 2;
export const SAVE_PRIORITY_HIGH = 3;
const BACKUP_INTERVAL = 300e3;
const SAVE_STANDBY = 0;
const SAVE_TIMES = [300e3, 58e3, 28e3, 13e3];
// considering a 2 sec skew for the setInterval
// saving every 5 minutes even if nothing changed


//Reimplementing the adapter to minify json onm prod builds
class JSONFile<T> implements Adapter<T> {
    #adapter: TextFile;
    #serializer: Function;

    constructor(filename: string) {
        this.#adapter = new TextFile(filename);
        this.#serializer = (convars.isDevMode)
            ? (obj: any) => JSON.stringify(obj, null, 4)
            : JSON.stringify;
    }

    async read(): Promise<T | null> {
        const data = await this.#adapter.read();
        if (data === null) {
            return null;
        } else {
            return JSON.parse(data) as T;
        }
    }

    write(obj: T): Promise<void> {
        return this.#adapter.write(this.#serializer(obj));
    }
}


// Extend Low class with a new `chain` field
//NOTE: lodash-es doesn't have ExpChain exported, so we need it from the original lodash
class LowWithLodash<T> extends Low<T> {
    chain: ExpChain<this['data']> = lodash.chain(this).get('data')
}
export type DatabaseObjectType = LowWithLodash<DatabaseDataType>;


export class Database {
    readonly dbPath: string;
    readonly backupPath: string;
    obj: DatabaseObjectType | undefined = undefined;
    #writePending: 0 | 1 | 2 | 3 = SAVE_STANDBY; //FIXME: enum
    lastWrite: number = 0;
    isReady: boolean = false;

    constructor() {
        this.dbPath = `${globals.info.serverProfilePath}/data/playersDB.json`;
        this.backupPath = `${globals.info.serverProfilePath}/data/playersDB.backup.json`;
        this.#writePending = SAVE_STANDBY;

        //Start database instance
        this.setupDatabase();

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
    async setupDatabase() {
        //Tries to load the database
        let dbo;
        try {
            const adapterAsync = new JSONFile<DatabaseDataType>(this.dbPath);
            dbo = new LowWithLodash(adapterAsync, defaultDatabase);
            await dbo.read();
        } catch (errorMain) {
            console.error('Your txAdmin player/actions database could not be loaded.');
            try {
                await fsp.copyFile(this.backupPath, this.dbPath);
                const adapterAsync = new JSONFile<DatabaseDataType>(this.dbPath);
                dbo = new LowWithLodash(adapterAsync, defaultDatabase);
                await dbo.read();
                console.warn('The database file was restored with the automatic backup file.');
                console.warn('A five minute rollback is expected.');
            } catch (errorBackup) {
                console.error('It was also not possible to load the automatic backup file.');
                console.error(`Main error: '${(errorMain as Error).message}'`);
                console.error(`Backup error: '${(errorBackup as Error).message}'`);
                console.error(`Database path: '${this.dbPath}'`);
                console.error('If there is a file in that location, you may try to delete or restore it manually.');
                process.exit(5600);
            }
        }

        //Setting up loaded database
        try {
            //Need to write the database, in case it is new
            await dbo.write();

            //Need to chain after setting defaults
            dbo.chain = lodash.chain(dbo.data);

            //If old database
            if (dbo.data.version !== DATABASE_VERSION) {
                await this.backupDatabase(`${globals.info.serverProfilePath}/data/playersDB.backup.v${dbo.data.version}.json`);
                this.obj = await migrations(dbo);
            } else {
                this.obj = dbo;
            }

            this.lastWrite = Date.now();
            this.isReady = true;
        } catch (error) {
            console.error('Failed to setup database object.');
            console.dir(error);
            process.exit(5601);
        }
    }


    /**
     * Creates a copy of the database file
     */
    async backupDatabase(targetPath?: string) {
        try {
            await fsp.copyFile(this.dbPath, targetPath ?? this.backupPath);
            console.verbose.debug('Database file backed up.');
        } catch (error) {
            console.error(`Failed to backup database file '${this.dbPath}'`);
            console.verbose.dir(error);
        }
    }


    /**
     * Set write pending flag
     */
    writeFlag(flag = SAVE_PRIORITY_MEDIUM) {
        if (![SAVE_PRIORITY_LOW, SAVE_PRIORITY_MEDIUM, SAVE_PRIORITY_HIGH].includes(flag)) {
            throw new Error('unknown priority flag!');
        }
        if (flag > this.#writePending) {
            console.verbose.log(`writeFlag > ${['no', 'low', 'med', 'high'][flag]}`);
            this.#writePending = flag;
        }
    }


    /**
     * Writes the database to the disk, taking in consideration the priority flag
     */
    async writeDatabase() {
        //Check if the database is ready
        if (!this.obj) return;

        const timeStart = Date.now();
        const sinceLastWrite = timeStart - this.lastWrite;

        if (this.#writePending === SAVE_PRIORITY_HIGH || sinceLastWrite > SAVE_TIMES[this.#writePending]) {
            try {
                await this.obj.write();
                const timeElapsed = Date.now() - timeStart;
                this.#writePending = SAVE_STANDBY;
                this.lastWrite = timeStart;
                console.verbose.debug(`DB file saved, took ${timeElapsed}ms.`);
            } catch (error) {
                console.error(`Failed to save players database with error: ${(error as Error).message}`);
                console.verbose.dir(error);
            }
        }
    }
}
