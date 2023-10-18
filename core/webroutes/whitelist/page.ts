const modulename = 'WebServer:WhitelistPage';
import consoleFactory from '@extras/console';
import { AuthedCtx } from '@core/components/WebServer/ctxTypes';
const console = consoleFactory(modulename);


/**
 * Returns the output page containing the action log, and the console log
 */
export default async function WhitelistPage(ctx: AuthedCtx) {
    const respData = {
        headerTitle: 'Whitelist',
        hasWhitelistPermission: ctx.admin.hasPermission('players.whitelist'),
        currentWhitelistMode: ctx.txAdmin.playerDatabase.config.whitelistMode,
    };
    return ctx.utils.render('main/whitelist', respData);
};
