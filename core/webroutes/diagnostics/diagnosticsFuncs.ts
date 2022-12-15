const modulename = 'WebServer:DiagnosticsFuncs';
import os from 'node:os';
import bytes from 'bytes';
import humanizeDuration, { HumanizerOptions } from 'humanize-duration';
import got from '@core/extras/got.js';
import getOsDistro from '@core/extras/getOsDistro.js';
import pidUsageTree from '@core/extras/pidUsageTree.js';
import { verbose, txEnv } from '@core/globalData';
import logger from '@core/extras/console.js';
import FXRunner from '@core/components/FxRunner';
import HealthMonitor from '@core/components/HealthMonitor';
import WebServer from '@core/components/WebServer';
import Logger from '@core/components/Logger';
const { dir, log, logOk, logWarn, logError } = logger(modulename);


/**
 * Gets the Processes Data.
 */
export const getProcessesData = async () => {
    type ProcDataType = {
        pid: number;
        ppid: number;
        name: string;
        cpu: string;
        memory: string;
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
            } else if (curr.memory <= 10 * 1024 * 1024) {
                procName = 'FXServer MiniDump';
            } else {
                procName = 'FXServer';
            }

            procList.push({
                pid: currPidInt,
                ppid: (curr.ppid == txProcessId) ? 'txAdmin' : curr.ppid,
                name: procName,
                cpu: (curr.cpu).toFixed(2) + '%',
                memory: bytes(curr.memory),
                order: order,
            });
        });
    } catch (error) {
        logError('Error getting processes tree usage data.');
        if (verbose) dir(error);
    }

    //Sort procList array
    procList.sort(( a, b ) => a.order - b.order);

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
        return {error: 'Server Offline'};
    }

    //Preparing request
    const requestOptions = {
        url: `http://${fxRunner.fxServerHost}/info.json`,
        maxRedirects: 0,
        timeout: healthMonitor.hardConfigs.timeout,
        retry: {limit: 0},
    };

    //Making HTTP Request
    let infoData: Record<string, any>;
    try {
        infoData = await got.get(requestOptions).json();
    } catch (error) {
        logWarn('Failed to get FXServer information.');
        if (verbose) dir(error);
        return {error: 'Failed to retrieve FXServer data. <br>The server must be online for this operation. <br>Check the terminal for more information (if verbosity is enabled)'};
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
        return {error: 'Failed to process FXServer data. <br>Check the terminal for more information (if verbosity is enabled)'};
    }
}


/**
 * Gets the Host Data.
 */
export const getHostData = async () => {
    const healthMonitor = (globals.healthMonitor as HealthMonitor);

    try {
        const userInfo = os.userInfo();
        const hostData = {
            nodeVersion: process.version,
            osDistro: await getOsDistro(),
            username: `${userInfo.username}`,
            memory: 'not available',
            cpus: 'not available',
            clockWarning: '',
            error: false,
        };

        const stats = healthMonitor.hostStats;
        if (stats) {
            hostData.memory = `${stats.memory.usage}% (${stats.memory.used.toFixed(2)}/${stats.memory.total.toFixed(2)} GB)`;
            hostData.cpus = `${stats.cpu.usage}% of ${stats.cpu.count}x ${stats.cpu.speed} MHz`;
            if (stats.cpu.count < 8) {
                if (stats.cpu.speed <= 2400) {
                    hostData.clockWarning = '<span class="badge badge-danger"> VERY SLOW! </span>';
                } else if (stats.cpu.speed < 3000) {
                    hostData.clockWarning = '<span class="badge badge-warning"> SLOW </span>';
                }
            }
        }
        return hostData;
    } catch (error) {
        logError('Error getting Host data');
        if (verbose) dir(error);
        return {error: 'Failed to retrieve host data. <br>Check the terminal for more information (if verbosity is enabled)'};
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
