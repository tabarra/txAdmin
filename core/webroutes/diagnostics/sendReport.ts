const modulename = 'WebServer:SendDiagnosticsReport';
import got from '@core/extras/got';
import { txEnv } from '@core/globalData';
import { GenericApiErrorResp } from '@shared/genericApiTypes';
import * as diagnosticsFuncs from './diagnosticsFuncs';
import { redactApiKeys } from '@core/extras/helpers';
import { getServerDataConfigs, getServerDataContent, ServerDataContentType, ServerDataConfigsType } from '@core/extras/serverDataScanner.js';
import MemCache from '@extras/MemCache';
import consoleFactory, { getLogBuffer } from '@extras/console';
import { AuthedCtx } from '@core/components/WebServer/ctxTypes';
import checksumMonitorFolder from '@core/checksumMonitorFolder';
const console = consoleFactory(modulename);

//Consts & Helpers
const reportIdCache = new MemCache<string>(60);
const maskedKeywords = ['key', 'license', 'pass', 'private', 'secret', 'token'];
const maskString = (input: string) => input.replace(/\w/gi, 'x');
const maskIps = (input: string) => input.replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/gi, 'x.x.x.x');
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
 */
export default async function SendDiagnosticsReport(ctx: AuthedCtx) {
    type SuccessResp = {
        reportId: string;
    };
    const sendTypedResp = (data: SuccessResp | GenericApiErrorResp) => ctx.send(data);

    //Rate limit (and cache) report submissions
    const cachedReportId = reportIdCache.get();
    if (cachedReportId) {
        return sendTypedResp({
            error: `You can send at most one report per minute. Your last report ID was ${cachedReportId}.`
        });
    }

    //Diagnostics
    let diagnostics;
    try {
        const [host, txadmin, fxserver, proccesses] = await Promise.all([
            diagnosticsFuncs.getHostData(ctx.txAdmin),
            diagnosticsFuncs.getTxAdminData(ctx.txAdmin),
            diagnosticsFuncs.getFXServerData(ctx.txAdmin),
            diagnosticsFuncs.getProcessesData(),
        ]);
        diagnostics = { host, txadmin, fxserver, proccesses };
    } catch (error) { }

    //Admins
    const adminList = (ctx.txAdmin.adminVault.getRawAdminsList() as any[])
        .map(a => ({ ...a, password_hash: '[REDACTED]' }));

    //Settings
    const settings = (ctx.txAdmin.configVault.getRawFile() as any);
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
    const txSystemLog = maskIps(getLogBuffer());

    const rawTxActionLog = await ctx.txAdmin.logger.admin.getRecentBuffer();
    const txActionLog = (typeof rawTxActionLog !== 'string')
        ? 'error reading log file'
        : maskIps(rawTxActionLog).split('\n').slice(-500).join('\n');

    const serverLog = (ctx.txAdmin.logger.server.getRecentBuffer(500) as ServerLogType[])
        .map((l) => ({ ...l, msg: maskIps(l.msg) }));
    const fxserverLog = maskIps(ctx.txAdmin.logger.fxserver.getRecentBuffer());

    //Getting server data content
    let serverDataContent: ServerDataContentType = [];
    let cfgFiles: ServerDataConfigsType = [];
    if (settings.fxRunner.serverDataPath) {
        serverDataContent = await getServerDataContent(settings.fxRunner.serverDataPath);
        const rawCfgFiles = await getServerDataConfigs(settings.fxRunner.serverDataPath, serverDataContent);
        cfgFiles = rawCfgFiles.map(([fName, fData]) => [fName, redactApiKeys(fData)]);
    }

    //Database & perf stats
    let dbStats = {};
    try {
        dbStats = ctx.txAdmin.playerDatabase.getDatabaseStats();
    } catch (error) { }

    let perfSvMain: ReturnType<typeof ctx.txAdmin.statsManager.svRuntime.getServerPerfSummary> = null;
    try {
        perfSvMain = ctx.txAdmin.statsManager.svRuntime.getServerPerfSummary();
    } catch (error) { }

    //Monitor integrity check
    let monitorContent = undefined;
    try {
        monitorContent = await checksumMonitorFolder();
    } catch (error) { }

    //Prepare report object
    const reportData = {
        $schemaVersion: 2,
        $txVersion: txEnv.txAdminVersion,
        $fxVersion: txEnv.fxServerVersion,
        diagnostics,
        txSystemLog,
        txActionLog,
        serverLog,
        fxserverLog,
        envVars,
        perfSvMain,
        dbStats,
        settings,
        adminList,
        serverDataContent,
        cfgFiles,
        monitorContent,
    };

    // //Preparing request
    const requestOptions = {
        url: `https://txapi.cfx-services.net/public/submit`,
        // url: `http://127.0.0.1:8121/public/submit`,
        retry: { limit: 1 },
        json: reportData,
    };

    //Making HTTP Request
    try {
        type ResponseType = { reportId: string } | { error: string, message?: string };
        const apiResp = await got.post(requestOptions).json() as ResponseType;
        if ('reportId' in apiResp) {
            reportIdCache.set(apiResp.reportId);
            console.warn(`Diagnostics data report ID ${apiResp.reportId} sent by ${ctx.admin.name}`);
            return sendTypedResp({ reportId: apiResp.reportId });
        } else {
            console.verbose.dir(apiResp);
            return sendTypedResp({ error: `Report failed: ${apiResp.message ?? apiResp.error}` });
        }
    } catch (error) {
        try {
            const apiErrorResp = JSON.parse((error as any)?.response?.body);
            const reason = apiErrorResp.message ?? apiErrorResp.error ?? (error as Error).message;
            return sendTypedResp({ error: `Report failed: ${reason}` });
        } catch (error2) {
            return sendTypedResp({ error: `Report failed: ${(error as Error).message}` });
        }
    }
};
