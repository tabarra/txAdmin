const modulename = 'PlayerDropStatsManager';
import fsp from 'node:fs/promises';
import consoleFactory from '@extras/console';
import type TxAdmin from '@core/txAdmin.js';
import { PDLFileSchema, PDLFileType, PDLHourlyRawType, PDLHourlyType, PDLServerBootDataSchema } from './playerDropSchemas';
import { classifyDropReason } from './classifyDropReason';
import { parseFxserverVersion } from '@extras/helpers';
import { PDL_RETENTION, PDL_UNKNOWN_LIST_SIZE_LIMIT } from './config';
import { ZodError } from 'zod';
import { getDateHourEnc, parseDateHourEnc } from './playerDropUtils';
import { MultipleCounter } from '../statsUtils';
import { throttle } from 'throttle-debounce';
const console = consoleFactory(modulename);


//Consts
const LOG_DATA_FILE_VERSION = 1;
const LOG_DATA_FILE_NAME = 'stats_playerDrop.json';


/**
 * Stores player drop logs, and also logs other information that might be relevant to player crashes,
 * such as changes to the detected game/server version, resources, etc.
 * 
 * NOTE: PDL = PlayerDropLog
 */
export default class PlayerDropStatsManager {
    readonly #txAdmin: TxAdmin;
    private readonly logFilePath: string;
    private eventLog: PDLHourlyType[] = [];
    private lastGameVersion: string | undefined;
    private lastServerVersion: string | undefined;
    private lastResourceList: string[] | undefined;
    private lastUnknownReasons: string[] = [];
    private queueSaveEventLog = throttle(
        15_000,
        this.saveEventLog.bind(this),
        { noLeading: true }
    );

    constructor(txAdmin: TxAdmin) {
        this.#txAdmin = txAdmin;
        this.logFilePath = `${txAdmin.info.serverProfilePath}/data/${LOG_DATA_FILE_NAME}`;
        this.loadEventLog();
    }


    /**
     * Get the recent category count for player drops in the last X hours
     */
    public getRecentStats(windowHours: number) {
        const logCutoff = (new Date).setUTCMinutes(0, 0, 0) - (windowHours * 60 * 60 * 1000) - 1;
        const flatCounts = this.eventLog
            .filter((entry) => entry.hour.dateHourTs >= logCutoff)
            .map((entry) => entry.dropTypes.toSortedValuesArray())
            .flat();
        const cumulativeCounter = new MultipleCounter();
        cumulativeCounter.merge(flatCounts);
        return cumulativeCounter.toSortedValuesArray();
    }


    /**
     * Get the recent category count for player drops in the last X hours
     */
    public getRecentCrashes(windowHours: number) {
        const logCutoff = (new Date).setUTCMinutes(0, 0, 0) - (windowHours * 60 * 60 * 1000) - 1;
        const flatCounts = this.eventLog
            .filter((entry) => entry.hour.dateHourTs >= logCutoff)
            .map((entry) => entry.crashTypes.toSortedValuesArray())
            .flat();
        const cumulativeCounter = new MultipleCounter();
        cumulativeCounter.merge(flatCounts);
        return cumulativeCounter.toSortedValuesArray();
    }


    /**
     * Returns the object of the current hour object in log.
     * Creates one if doesn't exist one for the current hour.
     */
    private getCurrentLogHourRef() {
        const { dateHourTs, dateHourStr } = getDateHourEnc();
        const currentHourLog = this.eventLog.find((entry) => entry.hour.dateHourStr === dateHourStr);
        if (currentHourLog) return currentHourLog;
        const newHourLog: PDLHourlyType = {
            hour: {
                dateHourTs: dateHourTs,
                dateHourStr: dateHourStr,
            },
            changes: [],
            crashTypes: new MultipleCounter(),
            dropTypes: new MultipleCounter(),
        };
        this.eventLog.push(newHourLog);
        return newHourLog;
    }


    /**
     * Handles receiving the data sent to the logger as soon as the server boots
     */
    public handleServerBootData(rawPayload: any) {
        const logRef = this.getCurrentLogHourRef();

        //Parsing data
        const validation = PDLServerBootDataSchema.safeParse(rawPayload);
        if (!validation.success) {
            console.warn(`Invalid server boot data: ${validation.error.errors}`);
            return;
        }
        const { gameName, gameBuild, fxsVersion, resources } = validation.data;
        let shouldSave = false;

        //Game version change
        const gameString = `${gameName}:${gameBuild}`;
        if (gameString) {
            if (!this.lastGameVersion) {
                shouldSave = true;
            } else if (gameString !== this.lastGameVersion) {
                shouldSave = true;
                logRef.changes.push({
                    ts: Date.now(),
                    type: 'gameChanged',
                    newVersion: gameString,
                });
            }
            this.lastGameVersion = gameString;
        }

        //Server version change
        let { build: serverBuild, platform: serverPlatform } = parseFxserverVersion(fxsVersion);
        const fxsVersionString = `${serverPlatform}:${serverBuild}`;
        if (fxsVersionString) {
            if (!this.lastServerVersion) {
                shouldSave = true;
            } else if (fxsVersionString !== this.lastServerVersion) {
                shouldSave = true;
                logRef.changes.push({
                    ts: Date.now(),
                    type: 'fxsChanged',
                    newVersion: fxsVersionString,
                });
            }
            this.lastServerVersion = fxsVersionString;
        }

        //Resource list change - if no resources, ignore as that's impossible
        if (resources.length) {
            if (!this.lastResourceList || !this.lastResourceList.length) {
                shouldSave = true;
            } else {
                const resAdded = resources.filter(r => !this.lastResourceList!.includes(r));
                const resRemoved = this.lastResourceList.filter(r => !resources.includes(r));
                if (resAdded.length || resRemoved.length) {
                    shouldSave = true;
                    logRef.changes.push({
                        ts: Date.now(),
                        type: 'resourcesChanged',
                        resAdded,
                        resRemoved,
                    });
                }
            }
            this.lastResourceList = resources;
        }

        //Saving if needed
        if (shouldSave) {
            this.queueSaveEventLog();
        }
    }


    /**
     * Handles receiving the player drop event, and returns the category of the drop
     */
    public handlePlayerDrop(reason: string) {
        const logRef = this.getCurrentLogHourRef();
        const { category, cleanReason } = classifyDropReason(reason);
        logRef.dropTypes.count(category);
        if (cleanReason) {
            if (category === 'crash') {
                logRef.crashTypes.count(cleanReason);
            } else if (category === 'unknown') {
                if (!this.lastUnknownReasons.includes(cleanReason)) {
                    this.lastUnknownReasons.push(cleanReason);
                }
            }
        }
        this.queueSaveEventLog();
        return category;
    }


    /**
     * Resets the player drop stats log
     */
    public resetLog(reason: string) {
        if (typeof reason !== 'string' || !reason) throw new Error(`reason required`);
        this.eventLog = [];
        this.lastGameVersion = undefined;
        this.lastServerVersion = undefined;
        this.lastResourceList = undefined;
        this.lastUnknownReasons = [];
        this.queueSaveEventLog.cancel({ upcomingOnly: true });
        this.saveEventLog(reason);
    }


    /**
     * Loads the stats database/cache/history
     */
    private async loadEventLog() {
        try {
            const rawFileData = await fsp.readFile(this.logFilePath, 'utf8');
            const fileData = JSON.parse(rawFileData);
            if (fileData?.version !== LOG_DATA_FILE_VERSION) throw new Error('invalid version');
            const statsData = PDLFileSchema.parse(fileData);
            this.lastGameVersion = statsData.lastGameVersion;
            this.lastServerVersion = statsData.lastServerVersion;
            this.lastResourceList = statsData.lastResourceList;
            this.lastUnknownReasons = statsData.lastUnknownReasons;
            this.eventLog = statsData.log.map((entry): PDLHourlyType => {
                return {
                    hour: parseDateHourEnc(entry.hour),
                    changes: entry.changes,
                    dropTypes: new MultipleCounter(entry.dropTypes),
                    crashTypes: new MultipleCounter(entry.crashTypes),
                }
            });
            console.verbose.debug(`Loaded ${this.eventLog.length} log entries from cache`);
            this.optimizeStatsLog();
        } catch (error) {
            if ((error as any)?.code === 'ENOENT') {
                console.verbose.debug(`${LOG_DATA_FILE_NAME} not found, starting with empty stats.`);
                this.resetLog('File was just created, no data yet');
            } else if (error instanceof ZodError) {
                console.warn(`Failed to load ${LOG_DATA_FILE_NAME} due to invalid data.`);
                this.resetLog('Failed to load log file due to invalid data');
            } else {
                console.warn(`Failed to load ${LOG_DATA_FILE_NAME} with message: ${(error as Error).message}`);
                this.resetLog('Failed to load log file due to unknown error');
            }
            console.warn('Since this is not a critical file, it will be reset.');
        }
    }


    /**
     * Optimizes the event log by removing old entries
     */
    private optimizeStatsLog() {
        if (this.lastUnknownReasons.length > PDL_UNKNOWN_LIST_SIZE_LIMIT) {
            this.lastUnknownReasons = this.lastUnknownReasons.slice(-PDL_UNKNOWN_LIST_SIZE_LIMIT);
        }

        const maxAge = Date.now() - PDL_RETENTION;
        const cutoffIdx = this.eventLog.findIndex((entry) => entry.hour.dateHourTs > maxAge);
        if (cutoffIdx > 0) {
            this.eventLog = this.eventLog.slice(cutoffIdx);
        }
    }


    /**
     * Saves the stats database/cache/history
     */
    private async saveEventLog(emptyReason?: string) {
        try {
            const sizeBefore = this.eventLog.length;
            this.optimizeStatsLog();
            if (!this.eventLog.length) {
                if (sizeBefore) {
                    emptyReason ??= 'Cleared due to retention policy';
                }
            } else {
                emptyReason = undefined;
            }

            const savePerfData: PDLFileType = {
                version: LOG_DATA_FILE_VERSION,
                emptyReason,
                lastGameVersion: this.lastGameVersion ?? 'unknown',
                lastServerVersion: this.lastServerVersion ?? 'unknown',
                lastResourceList: this.lastResourceList ?? [],
                lastUnknownReasons: this.lastUnknownReasons,
                log: this.eventLog.map((entry): PDLHourlyRawType => {
                    return {
                        hour: entry.hour.dateHourStr,
                        changes: entry.changes,
                        crashTypes: entry.crashTypes.toArray(),
                        dropTypes: entry.dropTypes.toArray(),
                    }
                }),
            };
            await fsp.writeFile(this.logFilePath, JSON.stringify(savePerfData));
        } catch (error) {
            console.warn(`Failed to save ${LOG_DATA_FILE_NAME} with message: ${(error as Error).message}`);
        }
    }
};
