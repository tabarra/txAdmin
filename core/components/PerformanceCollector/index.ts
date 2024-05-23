const modulename = 'PerformanceCollector';
import fsp from 'node:fs/promises';
import * as d3array from 'd3-array';
import consoleFactory from '@extras/console';
import type TxAdmin from '@core/txAdmin.js';
import { LogNodeHeapEventSchema, SSFileSchema, isSSLogDataType } from './perfSchemas';
import type { LogNodeHeapEventType, SSFileType, SSLogDataType, SSLogType, SSPerfBoundariesType, SSPerfCountsType } from './perfSchemas';
import { diffPerfs, fetchFxsMemory, fetchRawPerfData, perfCountsToHist } from './perfUtils';
import { optimizeStatsLog } from './statsLogOptimizer';
import { convars } from '@core/globalData';
import { ValuesType } from 'utility-types';
import bytes from 'bytes';
const console = consoleFactory(modulename);


//Consts
const minutesMs = 60 * 1000;
const hoursMs = 60 * minutesMs;
const megabyte = 1024 * 1024;


/**
 * Configs
 */
const STATS_DATA_FILE_VERSION = 1;
const STATS_DATA_FILE_NAME = 'statsData.json';
export const PERF_DATA_BUCKET_COUNT = 15;
export const PERF_DATA_MIN_TICKS = 2000; //less than that and the data is not reliable
export const PERF_DATA_INITIAL_RESOLUTION = 5 * minutesMs;
export const STATS_RESOLUTION_TABLE = [
    //00~12h =  5min = 12/h = 144 snaps
    //12~24h = 15min =  4/h =  48 snaps
    //24~96h = 30min =  2/h = 144 snaps
    { maxAge: 12 * hoursMs, resolution: PERF_DATA_INITIAL_RESOLUTION },
    { maxAge: 24 * hoursMs, resolution: 15 * minutesMs },
    { maxAge: 96 * hoursMs, resolution: 30 * minutesMs },
];
export const STATS_LOG_SIZE_LIMIT = 720; //144+48+144 (max data snaps) + 384 (1 reboot every 30 mins)
export const PERF_DATA_THREAD_NAMES = ['svNetwork', 'svSync', 'svMain'] as const;
export type PerfDataThreadNamesType = ValuesType<typeof PERF_DATA_THREAD_NAMES>;


/**
 * This module is reponsiple to collect many statistics from the server.
 * Most of those will be displayed on the Dashboard.
 */
export default class PerformanceCollector {
    readonly #txAdmin: TxAdmin;
    private readonly statsDataPath: string;
    private statsLog: SSLogType = [];
    private lastFxsMemory: number | undefined;
    private lastNodeMemory: { used: number, total: number } | undefined;
    private lastPerfBoundaries: SSPerfBoundariesType | undefined;
    private lastPerfCounts: SSPerfCountsType | undefined;
    private lastPerfSaved: {
        ts: number,
        counts: SSPerfCountsType,
    } | undefined;

    constructor(txAdmin: TxAdmin) {
        this.#txAdmin = txAdmin;
        this.statsDataPath = `${txAdmin.info.serverProfilePath}/data/${STATS_DATA_FILE_NAME}`;
        this.loadStatsHistory();

        //Cron functions
        setInterval(() => {
            this.collectStats().catch((error) => {
                console.verbose.warn('Error while collecting server stats.');
                console.verbose.dir(error);
            });
        }, 60 * 1000);
    }


    /**
     * Reset the last perf data except boundaries
     */
    resetPerfState() {
        this.lastPerfCounts = undefined;
        this.lastPerfSaved = undefined;
        this.lastNodeMemory = undefined;
        this.lastFxsMemory = undefined;
    }


    /**
     * Registers that fxserver has BOOTED (healthMonitor is ONLINE)
     */
    logServerBoot(bootTime: number) {
        this.resetPerfState();
        //If last log is a boot, remove it as the server didn't really start 
        // otherwise it would have lived long enough to have stats logged
        if (this.statsLog.length && this.statsLog.at(-1)!.type === 'svBoot') {
            this.statsLog.pop();
        }
        this.statsLog.push({
            ts: Date.now(),
            type: 'svBoot',
            bootTime,
        });
    }


    /**
     * Registers that fxserver has CLOSED (fxRunner killing the process)
     */
    logServerClose(reason: string) {
        this.resetPerfState();
        if (this.statsLog.length) {
            if (this.statsLog.at(-1)!.type === 'svClose') {
                //If last log is a close, skip saving a new one
                return;
            } else if (this.statsLog.at(-1)!.type === 'svBoot') {
                //If last log is a boot, remove it as the server didn't really start
                this.statsLog.pop();
                return;
            }
        }
        this.statsLog.push({
            ts: Date.now(),
            type: 'svClose',
            reason,
        });
    }


    /**
     * Stores the last server Node.JS memory usage for later use in the data log 
     */
    logServerNodeMemory(payload: LogNodeHeapEventType) {
        const validation = LogNodeHeapEventSchema.safeParse(payload);
        if (!validation.success) {
            console.verbose.warn('Invalid LogNodeHeapEvent payload:');
            console.verbose.dir(validation.error.errors);
            return;
        }
        this.lastNodeMemory = {
            used: parseFloat((payload.heapUsed / megabyte).toFixed(2)),
            total: parseFloat((payload.heapTotal / megabyte).toFixed(2)),
        };
    }


    /**
     * Get recent stats
     */
    getRecentStats() {
        return {
            joinLeaveTally30m: this.#txAdmin.playerlistManager.joinLeaveTally,
            fxsMemory: this.lastFxsMemory,
            nodeMemory: this.lastNodeMemory,
            perf: this.lastPerfCounts ? perfCountsToHist(this.lastPerfCounts) : undefined,
        }
    }


    /**
     * Cron function to collect all the stats and save it to the cache file
     */
    async collectStats() {
        //Precondition checks
        if (this.#txAdmin.fxRunner.fxChild === null) return;
        if (this.#txAdmin.playerlistManager === null) return;
        if (this.#txAdmin.healthMonitor.currentStatus !== 'ONLINE') return;

        //Get performance data
        const fxServerHost = (convars.debugExternalStatsSource)
            ? convars.debugExternalStatsSource
            : this.#txAdmin.fxRunner.fxServerHost;
        if (typeof fxServerHost !== 'string' || !fxServerHost) {
            throw new Error(`Invalid fxServerHost: ${fxServerHost}`);
        }

        //Fetch data
        const [fetchRawPerfDataRes, fetchFxsMemoryRes] = await Promise.allSettled([
            fetchRawPerfData(fxServerHost),
            fetchFxsMemory(),
        ]);
        if (fetchFxsMemoryRes.status === 'fulfilled') {
            this.lastFxsMemory = fetchFxsMemoryRes.value;
        }
        if (fetchRawPerfDataRes.status === 'rejected') throw fetchRawPerfDataRes.reason;
        const { perfBoundaries, perfMetrics } = fetchRawPerfDataRes.value;

        //Check for min tick count
        if (
            perfMetrics.svMain.count < PERF_DATA_MIN_TICKS ||
            perfMetrics.svNetwork.count < PERF_DATA_MIN_TICKS ||
            perfMetrics.svSync.count < PERF_DATA_MIN_TICKS
        ) {
            console.verbose.warn('Not enough ticks to log. Skipping this collection.');
            return;
        }

        //Check if first collection, boundaries changed
        if (!this.lastPerfCounts || !this.lastPerfSaved || !this.lastPerfBoundaries) {
            console.verbose.debug('First perf collection.');
            this.lastPerfBoundaries = perfBoundaries;
            this.resetPerfState();
        } else if (JSON.stringify(perfBoundaries) !== JSON.stringify(this.lastPerfBoundaries)) {
            console.warn('Performance boundaries changed. Resetting history.');
            this.statsLog = [];
            this.lastPerfBoundaries = perfBoundaries;
            this.resetPerfState();
        }

        //Checking if the counter (somehow) reset
        if (this.lastPerfCounts && this.lastPerfCounts.svMain.count > perfMetrics.svMain.count) {
            console.warn('Performance counter reset. Resetting lastPerfCounts/lastPerfSaved.');
            this.resetPerfState();
        } else if (this.lastPerfSaved && this.lastPerfSaved.counts.svMain.count > perfMetrics.svMain.count) {
            console.warn('Performance counter reset. Resetting lastPerfSaved.');
            this.lastPerfSaved = undefined;
        }

        //Calculate the tick/time counts since last collection (1m ago)
        const latestPerfHist = perfCountsToHist(diffPerfs(perfMetrics, this.lastPerfCounts));
        this.lastPerfCounts = perfMetrics;

        //Check if enough time passed since last collection
        const now = Date.now();
        let perfHistToSave;
        if (!this.lastPerfSaved) {
            perfHistToSave = latestPerfHist;
        } else if (now - this.lastPerfSaved.ts >= PERF_DATA_INITIAL_RESOLUTION) {
            perfHistToSave = perfCountsToHist(diffPerfs(perfMetrics, this.lastPerfSaved.counts));
        }
        if (!perfHistToSave) {
            console.verbose.debug('Not enough time passed since last saved collection. Skipping save.');
            return;
        }

        //Update cache
        this.lastPerfSaved = {
            ts: now,
            counts: perfMetrics,
        };
        const currSnapshot: SSLogDataType = {
            ts: now,
            type: 'data',
            players: this.#txAdmin.playerlistManager.onlineCount,
            fxsMemory: this.lastFxsMemory ?? null,
            nodeMemory: this.lastNodeMemory?.used ?? null,
            perf: perfHistToSave,
        };
        this.statsLog.push(currSnapshot);
        await optimizeStatsLog(this.statsLog);

        //Save perf series do file
        const savePerfData: SSFileType = {
            version: STATS_DATA_FILE_VERSION,
            lastPerfBoundaries: this.lastPerfBoundaries,
            log: this.statsLog,
        };
        await fsp.writeFile(this.statsDataPath, JSON.stringify(savePerfData));
        console.verbose.ok(`Collected performance snapshot #${this.statsLog.length}`);
    }


    /**
     * Loads the stats database/cache/history
     */
    async loadStatsHistory() {
        try {
            const rawFileData = await fsp.readFile(this.statsDataPath, 'utf8');
            const fileData = JSON.parse(rawFileData);
            if (fileData?.version !== STATS_DATA_FILE_VERSION) throw new Error('invalid version');
            const statsData = await SSFileSchema.parseAsync(fileData);
            this.lastPerfBoundaries = statsData.lastPerfBoundaries;
            this.statsLog = statsData.log;
            this.resetPerfState();
            console.verbose.debug(`Loaded ${this.statsLog.length} performance snapshots from cache`);
            optimizeStatsLog(this.statsLog);
        } catch (error) {
            console.warn(`Failed to load ${STATS_DATA_FILE_NAME} with message: ${(error as Error).message}`);
            console.warn('Since this is not a critical file, it will be reset.');
        }
    }


    /**
     * Returns a summary of the collected data and returns.
     * NOTE: kinda expensive
     */
    getServerPerfSummary() {
        //Configs
        const minSnapshots = 36; //3h of data
        const tsScanWindowStart = Date.now() - 6 * 60 * 60 * 1000; //6h ago

        //that's short for cumulative buckets, if you thought otherwise, i'm judging you
        const cumBuckets = Array(PERF_DATA_BUCKET_COUNT).fill(0);
        let cumTicks = 0;

        //Processing each snapshot - then each bucket
        let totalSnapshots = 0;
        const players = [];
        const fxsMemory = [];
        const nodeMemory = []
        for (const log of this.statsLog) {
            if (log.ts < tsScanWindowStart) continue;
            if (!isSSLogDataType(log)) continue;
            if (log.perf.svMain.count < PERF_DATA_MIN_TICKS) continue;
            totalSnapshots++
            players.push(log.players);
            fxsMemory.push(log.fxsMemory);
            nodeMemory.push(log.nodeMemory);
            for (let bIndex = 0; bIndex < PERF_DATA_BUCKET_COUNT; bIndex++) {
                const tickCount = log.perf.svMain.freqs[bIndex] * log.perf.svMain.count;
                cumTicks += tickCount;
                cumBuckets[bIndex] += tickCount;
            }
        }

        //Checking if at least 12h of data
        if (totalSnapshots < minSnapshots) {
            return null; //not enough data for meaningful analysis
        }

        //Formatting Output
        return {
            snaps: totalSnapshots,
            freqs: cumBuckets.map(cumAvg => cumAvg / cumTicks),
            players: d3array.median(players),
            fxsMemory: d3array.median(fxsMemory),
            nodeMemory: d3array.median(nodeMemory),
        };
    }
};
