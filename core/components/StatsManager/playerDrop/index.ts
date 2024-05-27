const modulename = 'PlayerDropStatsManager';
import fsp from 'node:fs/promises';
import consoleFactory from '@extras/console';
import type TxAdmin from '@core/txAdmin.js';
import { PDLFileSchema, PDLFileType, PDLLogType, PDLServerBootDataSchema } from './playerDropSchemas';
import { classifyDropReason } from './classifyDropReason';
import { parseFxserverVersion } from '@extras/helpers';
import { PDL_RETENTION, PDL_UNKNOWN_LIST_SIZE_LIMIT } from './config';
import { ZodError } from 'zod';
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
    private eventLog: PDLLogType = [];
    private lastGameVersion: string | undefined;
    private lastServerVersion: string | undefined;
    private lastResourceList: string[] | undefined;

    constructor(txAdmin: TxAdmin) {
        this.#txAdmin = txAdmin;
        this.logFilePath = `${txAdmin.info.serverProfilePath}/data/${LOG_DATA_FILE_NAME}`;
        this.loadEventLog();
    }


    /**
     * Handles receiving the data sent to the logger as soon as the server boots
     */
    public handleServerBootData(rawPayload: any) {
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
        if (gameString !== this.lastGameVersion) {
            shouldSave = true;
            this.lastGameVersion = gameString;
            this.eventLog.push({
                ts: Date.now(),
                type: 'gameChanged',
                newVersion: gameString,
            });
        }

        //Server version change
        let { build: serverBuild, platform: serverPlatform } = parseFxserverVersion(fxsVersion);
        const fxsVersionString = `${serverPlatform}:${serverBuild}`;
        if (fxsVersionString !== this.lastServerVersion) {
            shouldSave = true;
            this.lastServerVersion = fxsVersionString;
            this.eventLog.push({
                ts: Date.now(),
                type: 'fxsChanged',
                newVersion: fxsVersionString,
            });
        }

        //Resource list change - if no resources, ignore as that's impossible
        if (resources.length) {
            if (!this.lastResourceList || !this.lastResourceList.length) {
                shouldSave = true;
                this.eventLog.push({
                    ts: Date.now(),
                    type: 'resourcesChanged',
                    resAdded: resources,
                    resRemoved: [],
                });
            } else {
                const resAdded = resources.filter(r => !this.lastResourceList!.includes(r));
                const resRemoved = this.lastResourceList.filter(r => !resources.includes(r));
                if (resAdded.length || resRemoved.length) {
                    shouldSave = true;
                    this.eventLog.push({
                        ts: Date.now(),
                        type: 'resourcesChanged',
                        resAdded,
                        resRemoved,
                    });
                }
            }
        }

        //Saving if needed
        if (shouldSave) {
            this.saveEventLog();
        }
    }


    /**
     * Handles receiving the player drop event
     */
    public handlePlayerDrop(reason: string) {
        const { category, cleanReason } = classifyDropReason(reason);
        this.eventLog.push({
            ts: Date.now(),
            type: 'playerDrop',
            category,
            reason: cleanReason ?? 'unknown',
        });
        this.saveEventLog();
    }


    /**
     * Handles receiving the player drop event
     */
    public resetLog(reason: string) {
        if (typeof reason !== 'string' || !reason) throw new Error(`reason required`);
        this.eventLog = [];
        this.lastGameVersion = undefined;
        this.lastServerVersion = undefined;
        this.lastResourceList = undefined;
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
            this.eventLog = statsData.log;
            console.verbose.debug(`Loaded ${this.eventLog.length} player drop events from cache`);
            this.optimizeStatsLog();
        } catch (error) {
            if (error instanceof ZodError) {
                console.warn(`Failed to load ${LOG_DATA_FILE_NAME} due to invalid data.`);
            } else {
                console.warn(`Failed to load ${LOG_DATA_FILE_NAME} with message: ${(error as Error).message}`);
            }
            console.warn('Since this is not a critical file, it will be reset.');
        }
    }


    /**
     * Optimizes the event log by removing old entries
     */
    private optimizeStatsLog() {
        if (this.eventLog.length > PDL_UNKNOWN_LIST_SIZE_LIMIT) {
            this.eventLog = this.eventLog.slice(-PDL_UNKNOWN_LIST_SIZE_LIMIT);
        }
        const maxAge = Date.now() - PDL_RETENTION;
        const cutoffIdx = this.eventLog.findIndex((entry) => entry.ts > maxAge);
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
                log: this.eventLog,
            };
            await fsp.writeFile(this.logFilePath, JSON.stringify(savePerfData));
        } catch (error) {
            console.warn(`Failed to save ${LOG_DATA_FILE_NAME} with message: ${(error as Error).message}`);
        }
    }
};
