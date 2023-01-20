const modulename = 'WebServer:DiagnosticsFuncs';
import os from 'node:os';
import bytes from 'bytes';
import humanizeDuration, { HumanizerOptions } from 'humanize-duration';
import got from '@core/extras/got.js';
import getOsDistro from '@core/extras/getOsDistro.js';
import pidUsageTree from '@core/extras/pidUsageTree.js';
import { verbose, txEnv } from '@core/globalData';
import logger, { ogConsole } from '@core/extras/console.js';
import FXRunner from '@core/components/FxRunner';
import HealthMonitor from '@core/components/HealthMonitor';
import WebServer from '@core/components/WebServer';
import Logger from '@core/components/Logger';
import si from 'systeminformation';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

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

//Pre-calculate static data
setTimeout(() => {
    getHostData().catch();
}, 10_000);


/**
 * Gets the Processes Data.
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
                memory: curr.memory / (MEGABYTE),
                order: order,
            });
        });
    } catch (error) {
        logError('Error getting processes tree usage data.');
        if (verbose) dir(error);
    }

    //Sort procList array
    procList.sort((a, b) => a.order - b.order);

    return procList;
}


/**
 * Gets the FXServer Data.
 */
export const getFXServerData = async () => {
    const fxRunner = (globals.fxRunner as FXRunner);
    const healthMonitor = (globals.healthMonitor as HealthMonitor);

    //Sanity Check
    if (fxRunner.fxChild === null || fxRunner.fxServerHost === null) {
        return { error: 'Server Offline' };
    }

    //Preparing request
    const requestOptions = {
        url: `http://${fxRunner.fxServerHost}/info.json`,
        maxRedirects: 0,
        timeout: healthMonitor.hardConfigs.timeout,
        retry: { limit: 0 },
    };

    //Making HTTP Request
    let infoData: Record<string, any>;
    try {
        infoData = await got.get(requestOptions).json();
    } catch (error) {
        logWarn('Failed to get FXServer information.');
        if (verbose) dir(error);
        return { error: 'Failed to retrieve FXServer data. <br>The server must be online for this operation. <br>Check the terminal for more information (if verbosity is enabled)' };
    }

    //Helper function
    const getBuild = (ver: any) => {
        try {
            const res = /v1\.0\.0\.(\d{4,5})\s*/.exec(ver);
            // @ts-ignore: let it throw
            return parseInt(res[1]);
        } catch (error) {
            return 0;
        }
    };

    //Processing result
    try {
        return {
            error: false,
            statusColor: 'success',
            status: ' ONLINE ',
            version: infoData.server,
            versionMismatch: (getBuild(infoData.server) !== txEnv.fxServerVersion),
            resources: infoData.resources.length,
            onesync: (infoData.vars && infoData.vars.onesync_enabled === 'true') ? 'enabled' : 'disabled',
            maxClients: (infoData.vars && infoData.vars.sv_maxClients) ? infoData.vars.sv_maxClients : '--',
            txAdminVersion: (infoData.vars && infoData.vars['txAdmin-version']) ? infoData.vars['txAdmin-version'] : '--',
        };
    } catch (error) {
        logWarn('Failed to process FXServer information.');
        if (verbose) dir(error);
        return { error: 'Failed to process FXServer data. <br>Check the terminal for more information (if verbosity is enabled)' };
    }
}



/**
 * Gets the Host Data.
 */
export const getHostData = async (): Promise<HostDataReturnType> => {
    const healthMonitor = (globals.healthMonitor as HealthMonitor);

    //Get and cache static information
    if (!hostStaticDataCache) {
        try {
            const userInfo = os.userInfo();
            const cpuStats = await si.cpu();

            //TODO: move this to frontend
            let clockWarning = '';
            if (cpuStats.cores < 8) {
                if (cpuStats.speedMin <= 2.4) {
                    clockWarning = '<span class="badge badge-danger"> VERY SLOW! </span>';
                } else if (cpuStats.speedMin < 3.0) {
                    clockWarning = '<span class="badge badge-warning"> SLOW </span>';
                }
            }

            hostStaticDataCache = {
                nodeVersion: process.version,
                username: userInfo.username,
                osDistro: await getOsDistro(),
                cpu: {
                    manufacturer: cpuStats.manufacturer,
                    brand: cpuStats.brand,
                    speedMin: cpuStats.speedMin,
                    speedMax: cpuStats.speedMax,
                    physicalCores: cpuStats.physicalCores,
                    cores: cpuStats.cores,
                    clockWarning,
                }
            }
        } catch (error) {
            logError('Error getting Host static data.');
            if (verbose) dir(error);
            return { error: 'Failed to retrieve host static data. <br>Check the terminal for more information (if verbosity is enabled)' };
        }
    }

    //Get dynamic info (mem/cpu usage) and prepare output
    try {
        const stats = healthMonitor.hostStats;
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
        logError('Error getting Host dynamic data.');
        if (verbose) dir(error);
        return { error: 'Failed to retrieve host dynamic data. <br>Check the terminal for more information (if verbosity is enabled)' };
    }
}


/**
 * Gets txAdmin Data
 */
export const getTxAdminData = async () => {
    const fxRunner = (globals.fxRunner as FXRunner);
    const webServer = (globals.webServer as WebServer);
    const logger = (globals.logger as Logger);
    const databus = (globals.databus as any);

    const humanizeOptions: HumanizerOptions = {
        round: true,
        units: ['d', 'h', 'm'],
    };

    const httpCounter = databus.txStatsData.httpCounter;
    return {
        //Stats
        uptime: humanizeDuration(process.uptime() * 1000, humanizeOptions),
        httpCounterLog: httpCounter.log.join(', ') || '--',
        httpCounterMax: httpCounter.max || '--',
        monitorRestarts: {
            close: databus.txStatsData.monitorStats.restartReasons.close,
            heartBeat: databus.txStatsData.monitorStats.restartReasons.heartBeat,
            healthCheck: databus.txStatsData.monitorStats.restartReasons.healthCheck,
        },
        hbFD3Fails: databus.txStatsData.monitorStats.heartBeatStats.fd3Failed,
        hbHTTPFails: databus.txStatsData.monitorStats.heartBeatStats.httpFailed,
        hbBootSeconds: databus.txStatsData.monitorStats.bootSeconds.join(', ') || '--',
        freezeSeconds: databus.txStatsData.monitorStats.freezeSeconds.join(', ') || '--',
        koaSessions: Object.keys(webServer.koaSessionMemoryStore.sessions).length || '--',

        //Log stuff:
        logStorageSize: (await logger.getStorageSize()).total,
        loggerStatusAdmin: logger.admin.getUsageStats(),
        loggerStatusFXServer: logger.fxserver.getUsageStats(),
        loggerStatusServer: logger.server.getUsageStats(),

        //Env stuff
        fxServerPath: txEnv.fxServerPath,
        fxServerHost: (fxRunner.fxServerHost)
            ? fxRunner.fxServerHost
            : '--',
    };
}
