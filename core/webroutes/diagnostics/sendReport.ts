const modulename = 'WebServer:SendDiagnosticsReport';
import Logger from '@core/components/Logger';
import ConfigVault from '@core/components/ConfigVault';
import logger, { ogConsole } from '@core/extras/console.js';
import got from '@core/extras/got';
import { txEnv } from '@core/globalData';
import { GenericApiError } from '@shared/genericApiTypes';
import { Context } from 'koa';
import * as diagnosticsFuncs from './diagnosticsFuncs';
import AdminVault from '@core/components/AdminVault';
import { redactApiKeys } from '@core/extras/helpers';
const { dir, log, logOk, logWarn, logError, getLog } = logger(modulename);

//Consts & Helpers
const maskedKeywords = ['key', 'license', 'pass', 'private', 'secret', 'token'];
const maskString = (input: string) => input.replace(/\w/gi, 'x');
const maskIps = (input: string) => input.replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/gi, 'x.x.x.x');
type ConsolePrintType = {
    ts: number;
    type: string;
    ctx: string;
    msg: string;
}
type ServerLogType = {
    ts: number;
    type: string;
    src: {
        id: string | false;
        name: string;
    };
    msg: string;
}

/**
 * Prepares and sends the diagnostics report to txAPI
 * @param {object} ctx
 */
export default async function SendDiagnosticsReport(ctx: Context) {
    const logger = (globals.logger as Logger);
    const configVault = (globals.configVault as ConfigVault);
    const adminVault = (globals.adminVault as AdminVault);

    type SuccessResp = {
        reportId: string;
    };
    const sendTypedResp = (data: SuccessResp | GenericApiError) => ctx.send(data);

    // return sendTypedResp({ error: 'test error' });
    // return sendTypedResp({ reportId: 'sdfsdf' });


    //Diagnostics
    let diagnostics;
    try {
        const [host, txadmin, fxserver, proccesses] = await Promise.all([
            diagnosticsFuncs.getHostData(),
            diagnosticsFuncs.getTxAdminData(),
            diagnosticsFuncs.getFXServerData(),
            diagnosticsFuncs.getProcessesData(),
        ]);
        diagnostics = { host, txadmin, fxserver, proccesses };
    } catch (error) { }

    //Admins
    const adminList = (adminVault.getRawAdminsList() as any[])
        .map(a => ({ ...a, password_hash: '[REDACTED]' }));

    //Settings
    const settings = (configVault.getRawFile() as any);
    if (settings?.discordBot?.token) {
        settings.discordBot.token = '[REDACTED]';
    }
    if (settings?.fxRunner?.commandLine) {
        settings.fxRunner.commandLine = redactApiKeys(settings.fxRunner.commandLine);
    }

    //Env vars
    const envVars: Record<string, string> = {};
    for (const [envKey, envValue] of Object.entries(process.env)) {
        if (!envValue) continue;

        if (maskedKeywords.some((kw) => envKey.toLowerCase().includes(kw))) {
            envVars[envKey] = maskString(envValue);
        } else {
            envVars[envKey] = envValue;
        }
    }

    //Remove IP from logs
    const txConsoleLog = (getLog() as ConsolePrintType[])
        .slice(-500)
        .map((l) => ({ ...l, msg: maskIps(l.msg) }));

    const rawTxActionLog = await logger.admin.getRecentBuffer();
    const txActionLog = (typeof rawTxActionLog !== 'string')
        ? 'error reading log file'
        : maskIps(rawTxActionLog).split('\n').slice(-500).join('\n');

    const serverLog = (logger.server.getRecentBuffer(500) as ServerLogType[])
        .map((l) => ({ ...l, msg: maskIps(l.msg) }));

    //Prepare report object
    const reportData = {
        $schemaVersion: 1,
        $txVersion: txEnv.txAdminVersion,
        // diagnostics, //FIXME: add more hardware data
        // txConsoleLog, //DONE
        // txActionLog, //DONE
        // serverLog, //DONE
        // envVars, //DONE
        // perfSvMain: null, //TODO:
        // dbStats: null, //TODO:
        // settings, //DONE
        // adminList, //DONE
        // serverDataContent: null, //TODO:
        // cfgFiles: null, //TODO:
    };

    ogConsole.dir(reportData);

    


    // //Preparing request
    // const requestOptions = {
    //     url: `http://${globals.fxRunner.fxServerHost}/info.json`,
    //     maxRedirects: 0,
    //     timeout: globals.healthMonitor.hardConfigs.timeout,
    //     retry: {limit: 0},
    // };

    // //Making HTTP Request
    // let infoData: Record<string, unknown>;
    // try {
    //     infoData = await got.get(requestOptions).json();
    // } catch (error) {
    //     logWarn('Failed to get FXServer information.');
    //     if (verbose) dir(error);
    //     return {error: 'Failed to retrieve FXServer data. <br>The server must be online for this operation. <br>Check the terminal for more information (if verbosity is enabled)'};
    // }




    return sendTypedResp({ error: 'temp' });
};
