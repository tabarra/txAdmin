const modulename = 'WebServer:DiagnosticsFuncs';
import os from 'node:os';
import humanizeDuration, { HumanizerOptions } from 'humanize-duration';
import got from '@lib/got';
import getOsDistro from '@lib/host/getOsDistro.js';
import getHostUsage from '@lib/host/getHostUsage';
import pidUsageTree from '@lib/host/pidUsageTree.js';
import { txEnv, txHostConfig } from '@core/globalData';
import si from 'systeminformation';
import consoleFactory from '@lib/console';
import { parseFxserverVersion } from '@lib/fxserver/fxsVersionParser';
import { getHeapStatistics } from 'node:v8';
import bytes from 'bytes';
import { msToDuration } from './misc';
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
let _hostStaticDataCache: HostStaticDataType;


/**
 * Gets the Processes Data.
 * FIXME: migrate to use gwmi on windows by default
 */
export const getProcessesData = async () => {
    type ProcDataType = {
        pid: number;
        ppid: number | string;
        name: string;
        cpu: number;
        memory: number;
        order: number;
    }
    const procList: ProcDataType[] = [];
    try {
        const txProcessId = process.pid;
        const processes = await pidUsageTree(txProcessId);

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
                ppid: (curr.ppid === txProcessId) ? `${txProcessId} (txAdmin)` : curr.ppid,
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
export const getFXServerData = async () => {
    //Check runner child state
    const childState = txCore.fxRunner.child;
    if (!childState?.isAlive) {
        return { error: 'Server Offline' };
    }
    if (!childState?.netEndpoint) {
        return { error: 'Server is has no network endpoint' };
    }

    //Preparing request
    const requestOptions = {
        url: `http://${childState.netEndpoint}/info.json`,
        maxRedirects: 0,
        timeout: { request: 1500 },
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
            versionMismatch: (ver.build !== txEnv.fxsVersion),
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
            const cpuSpeed = cpuStats.speedMin ?? cpuStats.speed;

            //TODO: move this to frontend
            let clockWarning = '';
            if (cpuStats.cores < 8) {
                if (cpuSpeed <= 2.4) {
                    clockWarning = '<span class="badge badge-danger"> VERY SLOW! </span>';
                } else if (cpuSpeed < 3.0) {
                    clockWarning = '<span class="badge badge-warning"> SLOW </span>';
                }
            }

            _hostStaticDataCache = {
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
        } catch (error) {
            console.error('Error getting Host static data.');
            console.verbose.dir(error);
            return { error: 'Failed to retrieve host static data. <br>Check the terminal for more information (if verbosity is enabled)' };
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
        return { error: 'Failed to retrieve host dynamic data. <br>Check the terminal for more information (if verbosity is enabled)' };
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
export const getTxAdminData = async () => {
    const stats = txCore.metrics.txRuntime; //shortcut
    const memoryUsage = getHeapStatistics();

    let hostApiTokenState = 'not configured';
    if (txHostConfig.hostApiToken === 'disabled') {
        hostApiTokenState = 'disabled';
    } else if (txHostConfig.hostApiToken) {
        hostApiTokenState = 'configured';
    }

    const defaultFlags = Object.entries(txHostConfig.defaults).filter(([k, v]) => Boolean(v)).map(([k, v]) => k);
    return {
        //Stats
        uptime: msToDuration(process.uptime() * 1000),
        databaseFileSize: bytes(txCore.database.fileSize),
        txHostConfig: {
            ...txHostConfig,
            dataSubPath: undefined,
            hostApiToken: hostApiTokenState,
            defaults: defaultFlags,
        },
        txEnv: {
            ...txEnv,
            adsData: undefined,
        },
        monitor: {
            hbFails: {
                http: stats.monitorStats.healthIssues.http,
                fd3: stats.monitorStats.healthIssues.fd3,
            },
            restarts: {
                bootTimeout: stats.monitorStats.restartReasons.bootTimeout,
                close: stats.monitorStats.restartReasons.close,
                heartBeat: stats.monitorStats.restartReasons.heartBeat,
                healthCheck: stats.monitorStats.restartReasons.healthCheck,
                both: stats.monitorStats.restartReasons.both,
            }
        },
        performance: {
            banCheck: stats.banCheckTime.resultSummary('ms').summary,
            whitelistCheck: stats.whitelistCheckTime.resultSummary('ms').summary,
            playersTableSearch: stats.playersTableSearchTime.resultSummary('ms').summary,
            historyTableSearch: stats.historyTableSearchTime.resultSummary('ms').summary,
            databaseSave: stats.databaseSaveTime.resultSummary('ms').summary,
            perfCollection: stats.perfCollectionTime.resultSummary('ms').summary,
        },
        logger: {
            storageSize: (await txCore.logger.getStorageSize()).total,
            statusAdmin: txCore.logger.admin.getUsageStats(),
            statusFXServer: txCore.logger.fxserver.getUsageStats(),
            statusServer: txCore.logger.server.getUsageStats(),
        },
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
