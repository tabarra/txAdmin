const modulename = 'WebServer:WhitelistPage';
import logger from '@core/extras/console.js';
import { Context } from 'koa';
const { dir, log, logOk, logWarn, logError } = logger(modulename);


/**
 * Returns the output page containing the action log, and the console log
 */
export default async function WhitelistPage(ctx: Context) {
    const respData = {
        headerTitle: 'Whitelist',
        hasWhitelistPermission: ctx.utils.hasPermission('players.whitelist'),
    };
    return ctx.utils.render('main/whitelist', respData);
};
