const modulename = 'SvRuntimeMetrics';
import fsp from 'node:fs/promises';
import * as d3array from 'd3-array';
import consoleFactory from '@lib/console';
import { SvRtFileSchema, isSvRtLogDataType, isValidPerfThreadName, SvRtServerMemReportSchema } from './perfSchemas';
import type { SvRtFileType, SvRtLogDataType, SvRtLogType, SvRtNodeMemoryType, SvRtPerfBoundariesType, SvRtPerfCountsType } from './perfSchemas';
import { didPerfReset, diffPerfs, fetchRawPerfData } from './perfUtils';
import { parseRawPerf } from './perfParser';
import { optimizeSvRuntimeLog } from './logOptimizer';
import { txDevEnv, txEnv } from '@core/globalData';
import { ZodError } from 'zod';
import { PERF_DATA_BUCKET_COUNT, PERF_DATA_INITIAL_RESOLUTION, PERF_DATA_MIN_TICKS } from './config';
import { PerfChartApiResp } from '@routes/perfChart';
import got from '@lib/got';
import { throttle } from 'throttle-debounce';
import { TimeCounter } from '../statsUtils';
import { FxMonitorHealth } from '@shared/enums';
const console = consoleFactory(modulename);


//Consts
const LOG_DATA_FILE_VERSION = 1;
const LOG_DATA_FILE_NAME = 'stats_svRuntime.json';
const RAW_PERF_FILE_NAME = 'perf.txt';
const SERVER_MEM_REPORT_MAX_AGE = 35_000; //3 missed reports, see resource/sv_reportHeap.js

type ServerMemReport = {
    ts: number;
    nodeMemory: SvRtNodeMemoryType;
    fxsMemory: number | undefined; //whole FXServer process, in MB
};


/**
 * This module is reponsiple to collect many statistics from the server runtime
 * Most of those will be displayed on the Dashboard.
 */
export default class SvRuntimeMetrics {
    private readonly logFilePath = `${txEnv.profilePath}/data/${LOG_DATA_FILE_NAME}`;
    private readonly rawPerfFilePath = `${txEnv.profilePath}/data/${RAW_PERF_FILE_NAME}`;
    private perfAuthBase64: string | undefined;
    private statsLog: SvRtLogType = [];
    private lastServerMemReport: ServerMemReport | undefined;
    private memReportExpiryTimer: ReturnType<typeof setTimeout> | undefined;
    private lastPerfBoundaries: SvRtPerfBoundariesType | undefined;
    private lastRawPerfData: SvRtPerfCountsType | undefined;
    private lastDiffPerfData: SvRtPerfCountsType | undefined;
    private lastRawPerfSaved: {
        ts: number,
        data: SvRtPerfCountsType,
    } | undefined;
    private queueSaveStatsHistory = throttle(
        15_000,
        this.saveStatsHistory.bind(this),
        { noLeading: true }
    );

    constructor() {
        setImmediate(() => {
            this.loadStatsHistory();
        });

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
    private resetPerfState() {
        this.lastRawPerfData = undefined;
        this.lastDiffPerfData = undefined;
        this.lastRawPerfSaved = undefined;
    }


    /**
     * Reset the last memory report from the server
     */
    private resetMemoryState() {
        this.lastServerMemReport = undefined;
        clearTimeout(this.memReportExpiryTimer);
        this.memReportExpiryTimer = undefined;
    }


    /**
     * Returns the last memory report from the server, if it's recent enough.
     * Every consumer must go through here, so stale values are never shown after the
     * reports stop (server hang/exit).
     */
    private getFreshServerMemReport() {
        if (!this.lastServerMemReport) return;
        if (Date.now() - this.lastServerMemReport.ts > SERVER_MEM_REPORT_MAX_AGE) return;
        return this.lastServerMemReport;
    }


    /**
     * Returns the whole FXServer process memory in MB, as self-reported by the server.
     * Undefined if there is no recent report.
     */
    public getFxsMemory() {
        return this.getFreshServerMemReport()?.fxsMemory;
    }


    /**
     * Stores the latest authentication reported for the FXServer /perf/ endpoint.
     */
    public setPerfAuth(user: string, password: string) {
        if (!user || !password) {
            console.verbose.warn('SetPerfAuth event payload with empty user or password.', {
                user,
                passwordLength: password.length,
            });
            return;
        }
        this.perfAuthBase64 = Buffer.from(`${user}:${password}`).toString('base64');
    }


    /**
     * Clears authentication belonging to the previous FXServer instance.
     */
    public resetPerfAuth() {
        this.perfAuthBase64 = undefined;
    }


    /**
     * Registers that fxserver has BOOTED (FxMonitor is ONLINE)
     */
    public logServerBoot(duration: number) {
        this.resetPerfState();
        this.resetMemoryState();
        txCore.webServer.webSocket.pushRefresh('dashboard');

        //If last log is a boot, remove it as the server didn't really start 
        // otherwise it would have lived long enough to have stats logged
        if (this.statsLog.length && this.statsLog.at(-1)!.type === 'svBoot') {
            this.statsLog.pop();
        }
        this.statsLog.push({
            ts: Date.now(),
            type: 'svBoot',
            duration,
        });
        this.queueSaveStatsHistory();
    }


    /**
     * Registers that fxserver has CLOSED (fxRunner killing the process)
     */
    public logServerClose(reason: string) {
        this.resetPerfAuth();
        this.resetPerfState();
        this.resetMemoryState();
        txCore.webServer.webSocket.pushRefresh('dashboard');

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
        this.queueSaveStatsHistory();
    }


    /**
     * Stores the last server memory report (Node.js heap + whole process) for later use in the data log
     */
    public logServerNodeMemory(payload: unknown) {
        const validation = SvRtServerMemReportSchema.safeParse(payload);
        if (!validation.success) {
            console.verbose.warn('Invalid LogNodeHeapEvent payload:');
            console.verbose.dir(validation.error.errors);
            return;
        }
        const { ts, used, limit, rss } = validation.data;
        const now = Date.now();
        const reportTs = ts !== undefined ? Math.min(ts, now) : now; //never in the future, so it can't stay "fresh"
        this.lastServerMemReport = {
            ts: reportTs,
            nodeMemory: { used, limit },
            fxsMemory: rss,
        };
        txCore.webServer.webSocket.pushRefresh('dashboard');

        //If no other report comes in (server hang), refresh the dashboard once this one expires
        clearTimeout(this.memReportExpiryTimer);
        const expiresInMs = Math.max(0, reportTs + SERVER_MEM_REPORT_MAX_AGE - now);
        this.memReportExpiryTimer = setTimeout(() => {
            this.memReportExpiryTimer = undefined;
            txCore.webServer.webSocket.pushRefresh('dashboard');
        }, expiresInMs + 1_000);
    }


    /**
     * Get recent stats
     */
    public getRecentStats() {
        const serverMemReport = this.getFreshServerMemReport();
        return {
            fxsMemory: serverMemReport?.fxsMemory,
            nodeMemory: serverMemReport?.nodeMemory,
            perfBoundaries: this.lastPerfBoundaries,
            perfBucketCounts: this.lastDiffPerfData ? {
                svMain: this.lastDiffPerfData.svMain.buckets,
                svNetwork: this.lastDiffPerfData.svNetwork.buckets,
                svSync: this.lastDiffPerfData.svSync.buckets,
            } : undefined,
        };
    }


    /**
     * Cron function to collect all the stats and save it to the cache file
     */
    private async collectStats() {
        //Precondition checks
        const monitorStatus = txCore.fxMonitor.status;
        if (monitorStatus.health === FxMonitorHealth.OFFLINE) return; //collect even if partial
        if (monitorStatus.uptime < 30_000) return; //server barely booted
        if (!txCore.fxRunner.child?.isAlive) return;
        if (txEnv.fxsIsGen9 && !this.perfAuthBase64) {
            console.verbose.warn('Perf endpoint auth missing for Enhanced server, skipping collection.');
            return;
        }

        //Get performance data
        const netEndpoint = txDevEnv.EXT_STATS_HOST ?? txCore.fxRunner.child.netEndpoint;
        if (!netEndpoint) throw new Error(`Invalid netEndpoint: ${netEndpoint}`);

        const stopwatch = new TimeCounter();
        const rawPerf = await fetchRawPerfData(netEndpoint, this.perfAuthBase64);
        const collectionTime = stopwatch.stop();

        //Keep a copy of the latest raw /perf/ response for troubleshooting
        //NOTE: saved (async) before parsing so it's available even if the format is not recognized
        fsp.writeFile(this.rawPerfFilePath, rawPerf).catch((error) => {
            console.verbose.warn(`Failed to save ${RAW_PERF_FILE_NAME} with message: ${(error as Error).message}`);
        });

        const { perfBoundaries, perfMetrics } = parseRawPerf(rawPerf);
        txCore.metrics.txRuntime.perfCollectionTime.count(collectionTime.milliseconds);

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
        if (!this.lastPerfBoundaries) {
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
        if (this.lastRawPerfData && didPerfReset(perfMetrics, this.lastRawPerfData)) {
            console.warn('Performance counter reset. Resetting lastPerfCounts/lastPerfSaved.');
            this.resetPerfState();
        } else if (this.lastRawPerfSaved && didPerfReset(perfMetrics, this.lastRawPerfSaved.data)) {
            console.warn('Performance counter reset. Resetting lastPerfSaved.');
            this.lastRawPerfSaved = undefined;
        }

        //Calculate the tick/time counts since last collection (1m ago)
        this.lastDiffPerfData = diffPerfs(perfMetrics, this.lastRawPerfData);
        this.lastRawPerfData = perfMetrics;

        //Push the updated data to the dashboard ws room
        txCore.webServer.webSocket.pushRefresh('dashboard');

        //Check if enough time passed since last collection
        const now = Date.now();
        let perfToSave;
        if (!this.lastRawPerfSaved) {
            perfToSave = this.lastDiffPerfData;
        } else if (now - this.lastRawPerfSaved.ts >= PERF_DATA_INITIAL_RESOLUTION) {
            perfToSave = diffPerfs(perfMetrics, this.lastRawPerfSaved.data);
        }
        if (!perfToSave) return;

        //Get player count locally or from external source
        let playerCount = txCore.fxPlayerlist.onlineCount;
        if (txDevEnv.EXT_STATS_HOST) {
            try {
                const playerCountResp = await got(`http://${netEndpoint}/players.json`).json<any[]>();
                playerCount = playerCountResp.length;
            } catch (error) { }
        }

        //Update cache
        this.lastRawPerfSaved = {
            ts: now,
            data: perfMetrics,
        };
        const serverMemReport = this.getFreshServerMemReport();
        const currSnapshot: SvRtLogDataType = {
            ts: now,
            type: 'data',
            players: playerCount,
            fxsMemory: serverMemReport?.fxsMemory ?? null,
            nodeMemory: serverMemReport?.nodeMemory.used ?? null,
            perf: perfToSave,
        };
        this.statsLog.push(currSnapshot);
        // console.verbose.ok(`Collected performance snapshot #${this.statsLog.length}`);

        //Save perf series do file - not queued because it's priority
        this.queueSaveStatsHistory.cancel({ upcomingOnly: true });
        this.saveStatsHistory();
    }


    /**
     * Loads the stats database/cache/history
     */
    private async loadStatsHistory() {
        try {
            const rawFileData = await fsp.readFile(this.logFilePath, 'utf8');
            const fileData = JSON.parse(rawFileData);
            if (fileData?.version !== LOG_DATA_FILE_VERSION) throw new Error('invalid version');
            const statsData = SvRtFileSchema.parse(fileData);
            this.lastPerfBoundaries = statsData.lastPerfBoundaries;
            this.statsLog = statsData.log;
            this.resetPerfState();
            console.verbose.ok(`Loaded ${this.statsLog.length} performance snapshots from cache`);
            await optimizeSvRuntimeLog(this.statsLog);
        } catch (error) {
            if ((error as any)?.code === 'ENOENT') {
                console.verbose.debug(`${LOG_DATA_FILE_NAME} not found, starting with empty stats.`);
                return;
            }
            if (error instanceof ZodError) {
                console.warn(`Failed to load ${LOG_DATA_FILE_NAME} due to invalid data.`);
            } else {
                console.warn(`Failed to load ${LOG_DATA_FILE_NAME} with message: ${(error as Error).message}`);
            }
            console.warn('Since this is not a critical file, it will be reset.');
        }
    }


    /**
     * Saves the stats database/cache/history
     */
    private async saveStatsHistory() {
        try {
            await optimizeSvRuntimeLog(this.statsLog);
            const savePerfData: SvRtFileType = {
                version: LOG_DATA_FILE_VERSION,
                lastPerfBoundaries: this.lastPerfBoundaries,
                log: this.statsLog,
            };
            await fsp.writeFile(this.logFilePath, JSON.stringify(savePerfData));
        } catch (error) {
            console.warn(`Failed to save ${LOG_DATA_FILE_NAME} with message: ${(error as Error).message}`);
        }
    }


    /**
     * Returns the data for charting the performance of a specific thread
     */
    public getChartData(threadName: string): PerfChartApiResp {
        if (!isValidPerfThreadName(threadName)) return { fail_reason: 'invalid_thread_name' };
        if (!this.statsLog.length || !this.lastPerfBoundaries?.length) return { fail_reason: 'data_unavailable' };

        //Processing data
        return {
            boundaries: this.lastPerfBoundaries,
            threadPerfLog: this.statsLog.map((log) => {
                if (!isSvRtLogDataType(log)) return log;
                return {
                    ...log,
                    perf: log.perf[threadName],
                };
            })
        };
    }


    /**
     * Returns a summary of the collected data and returns.
     * NOTE: kinda expensive
     */
    public getServerPerfSummary() {
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
        const nodeMemory = [];
        for (const log of this.statsLog) {
            if (log.ts < tsScanWindowStart) continue;
            if (!isSvRtLogDataType(log)) continue;
            if (log.perf.svMain.count < PERF_DATA_MIN_TICKS) continue;
            totalSnapshots++;
            players.push(log.players);
            fxsMemory.push(log.fxsMemory);
            nodeMemory.push(log.nodeMemory);
            for (let bIndex = 0; bIndex < PERF_DATA_BUCKET_COUNT; bIndex++) {
                const tickCount = log.perf.svMain.buckets[bIndex];
                cumTicks += tickCount;
                cumBuckets[bIndex] += tickCount;
            }
        }

        //Checking if at least 36 snapshots (3h of data) in the last 6h
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
