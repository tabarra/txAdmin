const modulename = 'WebServer:WhitelistPage';
import { Context } from 'koa';
import consoleFactory from '@extras/newConsole';
const console = consoleFactory(modulename);


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
