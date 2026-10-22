const modulename = 'WebServer:DiagnosticsFuncs';
import os from 'node:os';
import getOsDistro from '@lib/host/getOsDistro.js';
import getHostUsage from '@lib/host/getHostUsage';
import getProcessTree, { type ProcessTreeSnapshot } from '@lib/host/getProcessTree';
import { calcCpuPercent, getTreeParentPid, type CpuSample, type OsProcInfo } from '@lib/host/processTreeUtils';
import { txEnv, txHostConfig } from '@core/globalData';
import si from 'systeminformation';
import consoleFactory from '@lib/console';
import { getHeapStatistics } from 'node:v8';
import bytes from 'bytes';
import { msToShortishDuration } from './misc';
import type { ProcessInfo } from '@shared/diagnosticsTypes';
const console = consoleFactory(modulename);


//Helpers
const MEGABYTE = 1024 * 1024;
type HostStaticDataType = {
    nodeVersion: string,
    username: string,
    osDistro: string,
    cpu: {
        manufacturer: string;
        brand: string;
        speedMin: number;
        speedMax: number;
        physicalCores: number;
        cores: number;
    },
};
type HostDynamicDataType = {
    cpuUsage: number;
    memory: {
        usage: number;
        used: number;
        total: number;
    },
};
type HostDataReturnType = {
    static: HostStaticDataType,
    dynamic?: HostDynamicDataType
} | { error: string };
let _hostStaticDataCache: HostStaticDataType;


/**
 * Process tree state, the CPU usage is calculated against the previous query (like pidusage did)
 * NOTE: the OS query is only done on demand (diagnostics page/report), never on a timer
 */
const PROCESS_DATA_CACHE_MS = 5_000;
const CPU_BASELINE_MAX_AGE_MS = 5 * 60_000;
let processDataCache: { ts: number, data: ProcessInfo[] } | undefined;
let processDataInFlight: Promise<ProcessInfo[]> | undefined;
let cpuBaseline: Map<number, CpuSample> | undefined;


/**
 * Returns the display name of a process in the tree
 */
const getProcessName = (proc: OsProcInfo, isRoot: boolean) => {
    if (isRoot) return 'txAdmin';
    if (proc.isDumpServer) return 'MiniDump';
    const exeName = proc.exeName ?? '';
    //Windows: FXServer.exe (Legacy) or cfx-server.exe (Enhanced), Linux: musl loader
    if (/^(fxserver|cfx-server)(\.exe)?$/i.test(exeName) || exeName.startsWith('ld-musl')) {
        return 'FXServer';
    }
    return exeName || 'Unknown';
};


/**
 * Converts an OS snapshot to the diagnostics process list, and updates the CPU baseline
 */
const snapshotToProcessInfo = (snapshot: ProcessTreeSnapshot): ProcessInfo[] => {
    const rootPid = process.pid;
    const treePids = new Set(snapshot.procs.map((proc) => proc.pid));
    const procList: ProcessInfo[] = [];
    const newBaseline = new Map<number, CpuSample>();
    for (const proc of snapshot.procs) {
        const sample: CpuSample = {
            ts: snapshot.ts,
            cpuTime: proc.cpuTime,
            startTime: proc.startTime,
        };
        newBaseline.set(proc.pid, sample);
        procList.push({
            pid: proc.pid,
            parent: getTreeParentPid(proc, rootPid, treePids), //keeps txAdmin at the top level
            name: getProcessName(proc, proc.pid === rootPid),
            cpu: calcCpuPercent(cpuBaseline?.get(proc.pid), sample, CPU_BASELINE_MAX_AGE_MS),
            memory: proc.memory !== null ? proc.memory / MEGABYTE : null,
        });
    }
    cpuBaseline = newBaseline;
    return procList;
};


/**
 * Partial process list from in-process data, for when the OS query fails
 */
const getFallbackProcessesData = (): ProcessInfo[] => {
    const procList: ProcessInfo[] = [{
        pid: process.pid,
        parent: process.ppid,
        name: 'txAdmin',
        cpu: null,
        memory: process.memoryUsage.rss() / MEGABYTE,
    }];
    const fxChild = txCore.fxRunner.child;
    if (fxChild?.isAlive && fxChild.pid) {
        procList.push({
            pid: fxChild.pid,
            parent: process.pid,
            name: 'FXServer',
            cpu: null,
            memory: txCore.metrics.svRuntime.getFxsMemory() ?? null,
        });
    }
    return procList;
};


/**
 * Queries the OS for the process tree, falling back to the partial list
 */
const fetchProcessesData = async () => {
    let data: ProcessInfo[];
    try {
        const snapshot = await getProcessTree(process.pid);
        data = snapshotToProcessInfo(snapshot);
    } catch (error) {
        console.warn(`Failed to list the txAdmin process tree, showing partial data: ${(error as Error).message}`);
        try {
            data = getFallbackProcessesData();
        } catch (fallbackError) {
            data = [];
        }
    }
    processDataCache = { ts: Date.now(), data };
    return data;
};


/**
 * Gets the Processes Data (txAdmin and all its descendants).
 * Concurrent calls share the same OS query, and results are cached for a few seconds.
 */
export const getProcessesData = async (): Promise<ProcessInfo[]> => {
    if (processDataCache && Date.now() - processDataCache.ts < PROCESS_DATA_CACHE_MS) {
        return processDataCache.data;
    }
    if (!processDataInFlight) {
        processDataInFlight = fetchProcessesData().finally(() => {
            processDataInFlight = undefined;
        });
    }
    return processDataInFlight;
};


/**
 * Gets the Host Data.
 */
export const getHostData = async (): Promise<HostDataReturnType> => {
    //Get and cache static information
    if (!_hostStaticDataCache) {
        //This errors out on pterodactyl egg
        let osUsername = 'unknown';
        try {
            const userInfo = os.userInfo();
            osUsername = userInfo.username;
        } catch (error) { }

        try {
            const cpuStats = await si.cpu();
            _hostStaticDataCache = {
                nodeVersion: process.version,
                username: osUsername,
                osDistro: await getOsDistro(),
                cpu: {
                    manufacturer: cpuStats.manufacturer,
                    brand: cpuStats.brand,
                    speedMin: cpuStats.speedMin ?? cpuStats.speed,
                    speedMax: cpuStats.speedMax,
                    physicalCores: cpuStats.physicalCores,
                    cores: cpuStats.cores,
                }
            }
        } catch (error) {
            console.error('Error getting Host static data.');
            console.verbose.dir(error);
            return { error: 'Failed to retrieve host static data. Check the terminal for more information (if verbosity is enabled).' };
        }
    }

    //Get dynamic info (mem/cpu usage) and prepare output
    try {
        const stats = await Promise.race([
            getHostUsage(),
            new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2500))
        ]);
        if (stats) {
            return {
                static: _hostStaticDataCache,
                dynamic: {
                    cpuUsage: stats.cpu.usage,
                    memory: {
                        usage: stats.memory.usage,
                        used: stats.memory.used,
                        total: stats.memory.total,
                    }
                }
            };
        } else {
            return {
                static: _hostStaticDataCache,
            };
        }
    } catch (error) {
        console.error('Error getting Host dynamic data.');
        console.verbose.dir(error);
        return { error: 'Failed to retrieve host dynamic data. Check the terminal for more information (if verbosity is enabled).' };
    }
}


/**
 * Gets the Host Static Data from cache.
 */
export const getHostStaticData = (): HostStaticDataType => {
    if (!_hostStaticDataCache) {
        throw new Error(`hostStaticDataCache not yet ready`);
    }
    return _hostStaticDataCache;
}


/**
 * Gets txAdmin Data
 */
export const getRuntimeData = async () => {
    const stats = txCore.metrics.txRuntime; //shortcut
    const memoryUsage = getHeapStatistics();

    let hostApiTokenState = 'not configured';
    if (txHostConfig.hostApiToken === 'disabled') {
        hostApiTokenState = 'disabled';
    } else if (txHostConfig.hostApiToken) {
        hostApiTokenState = 'configured';
    }

    let runtime = 'Unknown runtime';
    if ('Bun' in globalThis) {
        //@ts-ignore bun types not installed, just futureproofing
        runtime = `Bun v${Bun.version}`;
    } else if ('node' in process.versions && process.versions.node) {
        runtime = `Node.js v${process.versions.node}`;
    }

    const defaultFlags = Object.entries(txHostConfig.defaults).filter(([k, v]) => Boolean(v)).map(([k, v]) => k);
    return {
        txEnv,
        runtime,
        uptime: msToShortishDuration(process.uptime() * 1000),
        databaseFileSize: bytes(txCore.database.fileSize),
        txHostConfig: {
            ...txHostConfig,
            dataSubPath: undefined,
            hostApiToken: hostApiTokenState,
            defaults: defaultFlags,
        },
        monitor: {
            hbFails: stats.monitorStats.healthIssues,
            restarts: stats.monitorStats.restartReasons,
        },
        performance: {
            banCheck: stats.banCheckTime,
            whitelistCheck: stats.whitelistCheckTime,
            playersTableSearch: stats.playersTableSearchTime,
            historyTableSearch: stats.historyTableSearchTime,
            databaseSave: stats.databaseSaveTime,
            perfCollection: stats.perfCollectionTime,
        },
        logger: {
            storageSize: await txCore.logger.getStorageSize(),
            statusAdmin: txCore.logger.admin.getUsageStats(),
            statusFXServer: txCore.logger.fxserver.getUsageStats(),
            statusServer: txCore.logger.server.getUsageStats(),
        },
        memoryUsage: {
            heap_used: bytes(memoryUsage.used_heap_size) ?? '--',
            heap_limit: bytes(memoryUsage.heap_size_limit) ?? '--',
            heap_pct: (memoryUsage.heap_size_limit > 0)
                ? (memoryUsage.used_heap_size / memoryUsage.heap_size_limit * 100).toFixed(2)
                : 0,
            physical: bytes(memoryUsage.total_physical_size) ?? '--',
            peak_malloced: bytes(memoryUsage.peak_malloced_memory) ?? '--',
        },
    };
}
