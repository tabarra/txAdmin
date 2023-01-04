const modulename = 'WebServer:Diagnostics';
import logger from '@core/extras/console.js';
import Cache from '../../extras/dataCache';
import { Context } from 'koa';
import * as diagnosticsFuncs from './diagnosticsFuncs';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

const cache = new Cache(5);


/**
 * Returns the output page containing the full report
 * @param {object} ctx
 */
export default async function Diagnostics(ctx: Context) {
    const cachedData = cache.get();
    if (cachedData !== false) {
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
