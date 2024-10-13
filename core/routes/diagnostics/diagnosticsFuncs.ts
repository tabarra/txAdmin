const modulename = 'WebServer:DiagnosticsFuncs';
import os from 'node:os';
import humanizeDuration, { HumanizerOptions } from 'humanize-duration';
import got from '@core/extras/got.js';
import getOsDistro from '@core/extras/getOsDistro.js';
import pidUsageTree from '@core/extras/pidUsageTree.js';
import { txEnv } from '@core/globalData';
import si from 'systeminformation';
import consoleFactory from '@extras/console';
import TxAdmin from '@core/txAdmin';
import { parseFxserverVersion } from '@extras/fxsVersionParser';
import { getHeapStatistics } from 'node:v8';
import bytes from 'bytes';
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
        clockWarning: string;
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
let hostStaticDataCache: HostStaticDataType;


/**
 * Gets the Processes Data.
 * FIXME: migrate to use gwmi on windows by default
 */
export const getProcessesData = async () => {
    type ProcDataType = {
        pid: number;
        ppid: number;
        name: string;
        cpu: number;
        memory: number;
        order: number;
    }
    const procList: ProcDataType[] = [];
    try {
        const txProcessId = process.pid;
        const processes = await pidUsageTree(process.pid);

        //NOTE: Cleaning invalid proccesses that might show up in Linux
        Object.keys(processes).forEach((pid) => {
            if (processes[pid] === null) delete processes[pid];
        });

        //Foreach PID
        Object.keys(processes).forEach((pid) => {
            const curr = processes[pid];
            const currPidInt = parseInt(pid);

            //Define name and order
            let procName;
            let order = curr.timestamp || 1;
            if (currPidInt === txProcessId) {
                procName = 'txAdmin (inside FXserver)';
                order = 0; //forcing order because all process can start at the same second
            } else if (curr.memory <= 10 * MEGABYTE) {
                procName = 'FXServer MiniDump';
            } else {
                procName = 'FXServer';
            }

            procList.push({
                pid: currPidInt,
                ppid: (curr.ppid == txProcessId) ? 'txAdmin' : curr.ppid,
                name: procName,
                cpu: curr.cpu,
                memory: curr.memory / MEGABYTE,
                order: order,
            });
        });
    } catch (error) {
        if ((error as any).code = 'ENOENT') {
            console.error('Failed to get processes tree usage data.');
            if (txEnv.isWindows) {
                console.error('This is probably because the `wmic` command is not available in your system.');
                console.error('If you are on Windows 11 or Windows Server 2025, you can enable it in the "Windows Features" settings.');
            } else {
                console.error('This is probably because the `ps` command is not available in your system.');
                console.error('This command is part of the `procps` package in most Linux distributions.');
            }
        } else {
            console.error('Error getting processes tree usage data.');
            console.verbose.dir(error);
        }
    }

    //Sort procList array
    procList.sort((a, b) => a.order - b.order);

    return procList;
}


/**
 * Gets the FXServer Data.
 */
export const getFXServerData = async (txAdmin: TxAdmin) => {
    //Sanity Check
    if (txAdmin.fxRunner.fxChild === null || txAdmin.fxRunner.fxServerHost === null) {
        return { error: 'Server Offline' };
    }

    //Preparing request
    const requestOptions = {
        url: `http://${txAdmin.fxRunner.fxServerHost}/info.json`,
        maxRedirects: 0,
        timeout: {
            request: txAdmin.healthMonitor.hardConfigs.timeout
        },
        retry: { limit: 0 },
    };

    //Making HTTP Request
    let infoData: Record<string, any>;
    try {
        infoData = await got.get(requestOptions).json();
    } catch (error) {
        console.warn('Failed to get FXServer information.');
        console.verbose.dir(error);
        return { error: 'Failed to retrieve FXServer data. <br>The server must be online for this operation. <br>Check the terminal for more information (if verbosity is enabled)' };
    }

    //Processing result
    try {
        const ver = parseFxserverVersion(infoData.server);
        return {
            error: false,
            statusColor: 'success',
            status: ' ONLINE ',
            version: ver.valid ? `${ver.platform}:${ver.branch}:${ver.build}` : `${ver.platform ?? 'unknown'}:INVALID`,
            versionMismatch: (ver.build !== txEnv.fxServerVersion),
            resources: infoData.resources.length,
            onesync: (infoData.vars && infoData.vars.onesync_enabled === 'true') ? 'enabled' : 'disabled',
            maxClients: (infoData.vars && infoData.vars.sv_maxClients) ? infoData.vars.sv_maxClients : '--',
            txAdminVersion: (infoData.vars && infoData.vars['txAdmin-version']) ? infoData.vars['txAdmin-version'] : '--',
        };
    } catch (error) {
        console.warn('Failed to process FXServer information.');
        console.verbose.dir(error);
        return { error: 'Failed to process FXServer data. <br>Check the terminal for more information (if verbosity is enabled)' };
    }
}



/**
 * Gets the Host Data.
 */
export const getHostData = async (txAdmin: TxAdmin): Promise<HostDataReturnType> => {
    const tmpDurationDebugLog = (msg: string) => {
        // @ts-expect-error
        if (globals?.tmpSetHbDataTracking) {
            console.verbose.debug(`refreshHbData: ${msg}`);
        }
    }

    //Get and cache static information
    tmpDurationDebugLog('started');
    if (!hostStaticDataCache) {
        tmpDurationDebugLog('filling host static data cache');
        //This errors out on pterodactyl egg
        let osUsername = 'unknown';
        try {
            const userInfo = os.userInfo();
            tmpDurationDebugLog('got userInfo');
            osUsername = userInfo.username;
        } catch (error) { }

        try {
            const cpuStats = await si.cpu();
            tmpDurationDebugLog('got cpu');
            const cpuSpeed = cpuStats.speedMin || cpuStats.speed;

            //TODO: move this to frontend
            let clockWarning = '';
            if (cpuStats.cores < 8) {
                if (cpuSpeed <= 2.4) {
                    clockWarning = '<span class="badge badge-danger"> VERY SLOW! </span>';
                } else if (cpuSpeed < 3.0) {
                    clockWarning = '<span class="badge badge-warning"> SLOW </span>';
                }
            }

            hostStaticDataCache = {
                nodeVersion: process.version,
                username: osUsername,
                osDistro: await getOsDistro(),
                cpu: {
                    manufacturer: cpuStats.manufacturer,
                    brand: cpuStats.brand,
                    speedMin: cpuSpeed,
                    speedMax: cpuStats.speedMax,
                    physicalCores: cpuStats.physicalCores,
                    cores: cpuStats.cores,
                    clockWarning,
                }
            }
            tmpDurationDebugLog('finished');
        } catch (error) {
            console.error('Error getting Host static data.');
            console.verbose.dir(error);
            return { error: 'Failed to retrieve host static data. <br>Check the terminal for more information (if verbosity is enabled)' };
        }
    }

    //Get dynamic info (mem/cpu usage) and prepare output
    try {
        const stats = txAdmin.healthMonitor.hostStats;
        if (stats) {
            return {
                static: hostStaticDataCache,
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
                static: hostStaticDataCache,
            };
        }
    } catch (error) {
        console.error('Error getting Host dynamic data.');
        console.verbose.dir(error);
        return { error: 'Failed to retrieve host dynamic data. <br>Check the terminal for more information (if verbosity is enabled)' };
    }
}


/**
 * Gets the Host Static Data from cache.
 */
export const getHostStaticData = (): HostStaticDataType => {
    if (!hostStaticDataCache) {
        throw new Error(`hostStaticDataCache not yet ready`);
    }
    return hostStaticDataCache;
}


/**
 * Gets txAdmin Data
 */
export const getTxAdminData = async (txAdmin: TxAdmin) => {
    const humanizeOptions: HumanizerOptions = {
        round: true,
        units: ['d', 'h', 'm'],
    };

    const banCheckTime = txAdmin.statsManager.txRuntime.banCheckTime.resultSummary('ms');
    const whitelistCheckTime = txAdmin.statsManager.txRuntime.whitelistCheckTime.resultSummary('ms');
    const playersTableSearchTime = txAdmin.statsManager.txRuntime.playersTableSearchTime.resultSummary('ms');
    const historyTableSearchTime = txAdmin.statsManager.txRuntime.historyTableSearchTime.resultSummary('ms');
    const memoryUsage = getHeapStatistics();

    return {
        //Stats
        uptime: humanizeDuration(process.uptime() * 1000, humanizeOptions),
        monitorRestarts: {
            close: txAdmin.statsManager.txRuntime.monitorStats.restartReasons.close,
            heartBeat: txAdmin.statsManager.txRuntime.monitorStats.restartReasons.heartBeat,
            healthCheck: txAdmin.statsManager.txRuntime.monitorStats.restartReasons.healthCheck,
            both: txAdmin.statsManager.txRuntime.monitorStats.restartReasons.both,
        },
        hbFD3Fails: txAdmin.statsManager.txRuntime.monitorStats.healthIssues.fd3,
        hbHTTPFails: txAdmin.statsManager.txRuntime.monitorStats.healthIssues.http,
        banCheckTime,
        whitelistCheckTime,
        playersTableSearchTime,
        historyTableSearchTime,

        //Log stuff:
        logStorageSize: (await txAdmin.logger.getStorageSize()).total,
        loggerStatusAdmin: txAdmin.logger.admin.getUsageStats(),
        loggerStatusFXServer: txAdmin.logger.fxserver.getUsageStats(),
        loggerStatusServer: txAdmin.logger.server.getUsageStats(),

        //Env stuff
        fxServerPath: txEnv.fxServerPath,
        fxServerHost: (txAdmin.fxRunner.fxServerHost)
            ? txAdmin.fxRunner.fxServerHost
            : '--',

        //Usage stuff
        memoryUsage: {
            heap_used: bytes(memoryUsage.used_heap_size),
            heap_limit: bytes(memoryUsage.heap_size_limit),
            heap_pct: (memoryUsage.heap_size_limit > 0)
                ? (memoryUsage.used_heap_size / memoryUsage.heap_size_limit * 100).toFixed(2)
                : 0,
            physical: bytes(memoryUsage.total_physical_size),
            peak_malloced: bytes(memoryUsage.peak_malloced_memory),
        },
    };
}
