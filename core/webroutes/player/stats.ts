const modulename = 'WebServer:PlayersStats';
import consoleFactory from '@extras/console';
import { AuthedCtx } from '@core/components/WebServer/ctxTypes';
import { PlayersStatsResp } from '@shared/playerApiTypes';
const console = consoleFactory(modulename);


/**
 *  Returns the players stats for the Players page callouts
 */
export default async function PlayersStats(ctx: AuthedCtx) {
    const sendTypedResp = (data: PlayersStatsResp) => ctx.send(data);
    try {
        const stats = ctx.txAdmin.playerDatabase.getPlayersStats();
        return sendTypedResp(stats);
    } catch (error) {
        const msg = `getStats failed with error: ${(error as Error).message}`;
        console.verbose.error(msg);
        return sendTypedResp({ error: msg });
    }
};
