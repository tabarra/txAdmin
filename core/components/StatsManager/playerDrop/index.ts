const modulename = 'PlayerDropStatsManager';
import fsp from 'node:fs/promises';
import consoleFactory from '@extras/console';
import type TxAdmin from '@core/txAdmin.js';
import { PDLChangeEventType, PDLFileSchema, PDLFileType, PDLHourlyRawType, PDLHourlyType, PDLServerBootDataSchema } from './playerDropSchemas';
import { classifyDrop } from './classifyDropReason';
import { PDL_RETENTION, PDL_UNKNOWN_LIST_SIZE_LIMIT } from './config';
import { ZodError } from 'zod';
import { getDateHourEnc, parseDateHourEnc } from './playerDropUtils';
import { MultipleCounter } from '../statsUtils';
import { throttle } from 'throttle-debounce';
import { PlayerDropsDetailedWindow, PlayerDropsSummaryHour } from '@core/webroutes/playerDrops';
import { migratePlayerDropsFile } from './playerDropMigrations';
import { parseFxserverVersion } from '@extras/fxsVersionParser';
import { PlayerDropEvent } from '@core/components/PlayerlistManager';
const console = consoleFactory(modulename);


//Consts
export const LOG_DATA_FILE_VERSION = 2;
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
    public getRecentDropTally(windowHours: number) {
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
     * Get the recent log with drop/crash/changes for the last X hours
     */
    public getRecentSummary(windowHours: number): PlayerDropsSummaryHour[] {
        const logCutoff = (new Date).setUTCMinutes(0, 0, 0) - (windowHours * 60 * 60 * 1000);
        const windowSummary = this.eventLog
            .filter((entry) => entry.hour.dateHourTs >= logCutoff)
            .map((entry) => ({
                hour: entry.hour.dateHourStr,
                changes: entry.changes.length,
                dropTypes: entry.dropTypes.toSortedValuesArray(),
            }));
        return windowSummary;
    }


    /**
     * Get the data for the player drops drilldown card within a inclusive time window
     */
    public getWindowData(windowStart: number, windowEnd: number): PlayerDropsDetailedWindow {
        const allChanges: PDLChangeEventType[] = [];
        const crashTypes = new MultipleCounter();
        const dropTypes = new MultipleCounter();
        const resKicks = new MultipleCounter();
        const filteredLogs = this.eventLog.filter((entry) => {
            return entry.hour.dateHourTs >= windowStart && entry.hour.dateHourTs <= windowEnd;
        });
        for (const log of filteredLogs) {
            allChanges.push(...log.changes);
            crashTypes.merge(log.crashTypes);
            dropTypes.merge(log.dropTypes);
            resKicks.merge(log.resKicks);
        }
        return {
            changes: allChanges,
            crashTypes: crashTypes.toSortedValuesArray(true),
            dropTypes: dropTypes.toSortedValuesArray(true),
            resKicks: resKicks.toSortedValuesArray(true),
        };
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
            resKicks: new MultipleCounter(),
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
                    oldVersion: this.lastGameVersion,
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
                    oldVersion: this.lastServerVersion,
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
    public handlePlayerDrop(event: PlayerDropEvent) {
        const drop = classifyDrop(event);

        //Ignore server shutdown drops
        if (drop.category === false) return false;

        //Log the drop
        const logRef = this.getCurrentLogHourRef();
        logRef.dropTypes.count(drop.category);
        if (drop.category === 'resource' && drop.resource) {
            logRef.resKicks.count(drop.resource);
        } else if (drop.category === 'crash' && drop.cleanReason) {
            logRef.crashTypes.count(drop.cleanReason);
        } else if (drop.category === 'unknown' && drop.cleanReason) {
            if (!this.lastUnknownReasons.includes(drop.cleanReason)) {
                this.lastUnknownReasons.push(drop.cleanReason);
            }
        }
        this.queueSaveEventLog();
        return drop.category;
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
            let statsData: PDLFileType;
            if (fileData.version === LOG_DATA_FILE_VERSION) {
                statsData = PDLFileSchema.parse(fileData);
            } else {
                try {
                    statsData = await migratePlayerDropsFile(fileData);
                } catch (error) {
                    throw new Error(`Failed to migrate ${LOG_DATA_FILE_NAME} from ${fileData?.version} to ${LOG_DATA_FILE_VERSION}: ${(error as Error).message}`);
                }
            }
            this.lastGameVersion = statsData.lastGameVersion;
            this.lastServerVersion = statsData.lastServerVersion;
            this.lastResourceList = statsData.lastResourceList;
            this.lastUnknownReasons = statsData.lastUnknownReasons;
            this.eventLog = statsData.log.map((entry): PDLHourlyType => {
                return {
                    hour: parseDateHourEnc(entry.hour),
                    changes: entry.changes,
                    crashTypes: new MultipleCounter(entry.crashTypes),
                    dropTypes: new MultipleCounter(entry.dropTypes),
                    resKicks: new MultipleCounter(entry.resKicks),
                }
            });
            console.verbose.debug(`Loaded ${this.eventLog.length} log entries from cache`);
            this.optimizeStatsLog();
        } catch (error) {
            if ((error as any)?.code === 'ENOENT') {
                console.verbose.debug(`${LOG_DATA_FILE_NAME} not found, starting with empty stats.`);
                this.resetLog('File was just created, no data yet');
                return;
            }
            if (error instanceof ZodError) {
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
                        resKicks: entry.resKicks.toArray(),
                    }
                }),
            };
            await fsp.writeFile(this.logFilePath, JSON.stringify(savePerfData));
        } catch (error) {
            console.warn(`Failed to save ${LOG_DATA_FILE_NAME} with message: ${(error as Error).message}`);
        }
    }
};
