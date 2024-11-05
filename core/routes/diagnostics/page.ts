const modulename = 'WebServer:Diagnostics';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import MemCache from '@lib/MemCache';
import * as diagnosticsFuncs from '@lib/diagnostics';
import consoleFactory from '@lib/console';
const console = consoleFactory(modulename);
const cache = new MemCache(5);


/**
 * Returns the output page containing the full report
 */
export default async function Diagnostics(ctx: AuthedCtx) {
    const cachedData = cache.get();
    if (cachedData) {
        cachedData.message = 'This page was cached in the last 5 seconds';
        return ctx.utils.render('main/diagnostics', cachedData);
    }

    const timeStart = Date.now();
    const data: any = {
        headerTitle: 'Diagnostics',
        message: '',
    };
    [data.host, data.txadmin, data.fxserver, data.proccesses] = await Promise.all([
        diagnosticsFuncs.getHostData(),
        diagnosticsFuncs.getTxAdminData(),
        diagnosticsFuncs.getFXServerData(),
        diagnosticsFuncs.getProcessesData(),
    ]);

    const timeElapsed = Date.now() - timeStart;
    data.message = `Executed in ${timeElapsed} ms`;

    cache.set(data);
    return ctx.utils.render('main/diagnostics', data);
};
