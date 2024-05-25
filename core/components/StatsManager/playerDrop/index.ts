const modulename = 'PlayerDropStatsManager';
import consoleFactory from '@extras/console';
import type TxAdmin from '@core/txAdmin.js';
const console = consoleFactory(modulename);


//Consts
const STATS_DATA_FILE_VERSION = 1;
const STATS_DATA_FILE_NAME = 'stats_playerDrop.json';


/**
 * FIXME:
 */
export default class PlayerDropStatsManager {
    readonly #txAdmin: TxAdmin;
    private readonly statsDataPath: string;

    constructor(txAdmin: TxAdmin) {
        this.#txAdmin = txAdmin;
        this.statsDataPath = `${txAdmin.info.serverProfilePath}/data/${STATS_DATA_FILE_NAME}`;
        this.loadStatsHistory();
    }


    /**
     * Loads the stats database/cache/history
     */
    async loadStatsHistory() {
        // try {
        //     const rawFileData = await fsp.readFile(this.statsDataPath, 'utf8');
        //     const fileData = JSON.parse(rawFileData);
        //     if (fileData?.version !== STATS_DATA_FILE_VERSION) throw new Error('invalid version');
        //     const statsData = SSFileSchema.parse(fileData);
        //     this.lastPerfBoundaries = statsData.lastPerfBoundaries;
        //     this.statsLog = statsData.log;
        //     this.resetPerfState();
        //     console.verbose.debug(`Loaded ${this.statsLog.length} performance snapshots from cache`);
        //     await optimizeStatsLog(this.statsLog);
        // } catch (error) {
        //     if (error instanceof ZodError) {
        //         console.warn(`Failed to load ${STATS_DATA_FILE_NAME} due to invalid data.`);
        //         console.warn('Since this is not a critical file, it will be reset.');
        //     } else {
        //         console.warn(`Failed to load ${STATS_DATA_FILE_NAME} with message: ${(error as Error).message}`);
        //         console.warn('Since this is not a critical file, it will be reset.');
        //     }
        // }
    }


    /**
     * Saves the stats database/cache/history
     */
    async saveStatsHistory() {
        try {
            // await optimizeStatsLog(this.statsLog);
            // const savePerfData: SSFileType = {
            //     version: STATS_DATA_FILE_VERSION,
            //     lastPerfBoundaries: this.lastPerfBoundaries,
            //     log: this.statsLog,
            // };
            // await fsp.writeFile(this.statsDataPath, JSON.stringify(savePerfData));
        } catch (error) {
            console.warn(`Failed to save ${STATS_DATA_FILE_NAME} with message: ${(error as Error).message}`);
        }
    }


    /**
     * FIXME:
     */
    getServerPerfSummary() {
        //FIXME:
    }
};
