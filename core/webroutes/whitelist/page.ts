const modulename = 'WebServer:WhitelistPage';
import consoleFactory from '@extras/console';
import PlayerDatabase from '@core/components/PlayerDatabase';
import { WebCtx } from '@core/components/WebServer/ctxUtils';
const console = consoleFactory(modulename);


/**
 * Returns the output page containing the action log, and the console log
 */
export default async function WhitelistPage(ctx: WebCtx) {
    //Typescript stuff
    const playerDatabase = (globals.playerDatabase as PlayerDatabase);

    const respData = {
        headerTitle: 'Whitelist',
        hasWhitelistPermission: ctx.utils.hasPermission('players.whitelist'),
        currentWhitelistMode: playerDatabase.config.whitelistMode,
    };
    return ctx.utils.render('main/whitelist', respData);
};
