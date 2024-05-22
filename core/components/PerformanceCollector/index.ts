const modulename = 'PerformanceCollector';
import fsp from 'node:fs/promises';
import * as d3array from 'd3-array';
import consoleFactory from '@extras/console';
import type TxAdmin from '@core/txAdmin.js';
import { PERF_DATA_BUCKET_COUNT, PERF_DATA_MIN_TICKS, SSFileSchema, isSSLogDataType } from './perfSchemas';
import type { SSFileType, SSLogDataType, SSLogType, SSPerfBucketBoundariesType, SSRawPerfType } from './perfSchemas';
import { diffPerfs, fetchFxsMemory, fetchPerfData, rawPerfToFreqs } from './perfUtils';
import { optimizeStatsLog } from './statsLogOptimizer';
import { convars } from '@core/globalData';
const console = consoleFactory(modulename);


//Consts
const STATS_DATA_FILE_VERSION = 1;
const STATS_DATA_FILE_NAME = 'statsData.json';


export default class PerformanceCollector {
    readonly #txAdmin: TxAdmin;
    private readonly statsDataPath: string;
    private statsLog: SSLogType = [];
    private lastPerfBucketBoundaries: SSPerfBucketBoundariesType | undefined;
    private lastRawPerf: SSRawPerfType | undefined;
    private lastNodeMemory: { used: number, total: number } | undefined;
    private lastFxsMemory: number | undefined;

    constructor(txAdmin: TxAdmin) {
        this.#txAdmin = txAdmin;
        this.statsDataPath = `${txAdmin.info.serverProfilePath}/data/${STATS_DATA_FILE_NAME}`;
        this.loadStatsHistory();

        //Cron functions
        setInterval(() => {
            this.collectStats().catch((error) => {
                console.verbose.warn('Error while collecting fxserver performance data');
                console.verbose.dir(error);
            });
        }, 60 * 1000);
    }


    /**
     * Registers that fxserver has BOOTED (healthMonitor is ONLINE)
     */
    logServerBoot(bootTime: number) {
        //TODO: if last log is a boot, remove it as the server didn't really start if it didn't live enough to have the stats logged
        //FIXME: do we need any other kind of logic?
    }


    /**
     * Registers that fxserver has CLOSED (fxRunner killing the process)
     */
    logServerClose(reason: string) {
        //TODO: if last log is not of data type, don't even register it?
        //FIXME: do we need any other kind of logic?
    }


    /**
     * Stores the last server Node.JS memory usage for later use in the data log 
     */
    logServerNodeMemory(heapUsedBytes: number, heapTotalBytes: number) {
        //FIXME: disabled for now
        //TODO: convert to mb
    }


    /**
     * Get recent stats
     */
    getRecentStats() {
        return {
            joinLeaveTally30m: this.#txAdmin.playerlistManager.joinLeaveTally,
            fxsMemory: this.lastFxsMemory,
            nodeMemory: this.lastNodeMemory,
            perf: this.lastRawPerf ? rawPerfToFreqs(this.lastRawPerf) : undefined,
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
        const [fetchPerfDataRes, fetchFxsMemoryRes] = await Promise.allSettled([
            fetchPerfData(fxServerHost),
            fetchFxsMemory(),
        ]);
        if (fetchFxsMemoryRes.status === 'fulfilled') {
            this.lastFxsMemory = fetchFxsMemoryRes.value;
        }
        if (fetchPerfDataRes.status === 'rejected') throw fetchPerfDataRes.reason;
        const { bucketBoundaries, perfMetrics } = fetchPerfDataRes.value;

        //Check for min tick count
        if (
            perfMetrics.svMain.count < PERF_DATA_MIN_TICKS ||
            perfMetrics.svNetwork.count < PERF_DATA_MIN_TICKS ||
            perfMetrics.svSync.count < PERF_DATA_MIN_TICKS
        ) {
            console.verbose.warn('Not enough ticks to log. Skipping this collection.');
            return;
        }

        //Check if first collection, boundaries changed, or counter (somehow) reset
        if (!this.lastRawPerf || !this.lastPerfBucketBoundaries) {
            console.verbose.log('First perf collection');
            this.lastPerfBucketBoundaries = bucketBoundaries;
        } else if (JSON.stringify(bucketBoundaries) !== JSON.stringify(this.lastPerfBucketBoundaries)) {
            console.warn('Performance boundaries changed. Resetting history.');
            this.statsLog = [];
            this.lastPerfBucketBoundaries = bucketBoundaries;
            this.lastRawPerf = undefined;
        } else if (this.lastRawPerf.svMain.count > perfMetrics.svMain.count) {
            console.warn('Performance counter reset. Resetting lastRawPerf.');
            this.lastRawPerf = undefined;
        }

        //Calculate the tick/time counts since last epoch
        const currRawPerfDiff = diffPerfs(perfMetrics, this.lastRawPerf);
        const currPerfLogData = rawPerfToFreqs(currRawPerfDiff);

        //Update cache
        const now = Date.now();
        this.lastRawPerf = perfMetrics;
        const currSnapshot: SSLogDataType = {
            ts: now,
            type: 'data',
            players: this.#txAdmin.playerlistManager.onlineCount,
            fxsMemory: this.lastFxsMemory ?? null,
            nodeMemory: this.lastNodeMemory?.used ?? null,
            perf: currPerfLogData,
        };
        this.statsLog.push(currSnapshot);
        optimizeStatsLog(this.statsLog);

        //Save perf series do file
        const savePerfData: SSFileType = {
            version: STATS_DATA_FILE_VERSION,
            lastPerfBucketBoundaries: this.lastPerfBucketBoundaries,
            lastPerfData: this.lastRawPerf,
            log: this.statsLog,
        };
        try {
            await fsp.writeFile(this.statsDataPath, JSON.stringify(savePerfData));
            console.verbose.ok(`Collected performance snapshot #${this.statsLog.length}`);
        } catch (error) {
            console.verbose.warn('Failed to write the performance history log file with error:');
            console.verbose.dir(error);
        }
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
            this.lastPerfBucketBoundaries = statsData.lastPerfBucketBoundaries;
            this.lastRawPerf = statsData.lastPerfData;
            this.statsLog = statsData.log;
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
