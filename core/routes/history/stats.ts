const modulename = 'WebServer:HistoryStats';
import consoleFactory from '@lib/console';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import { HistoryStatsResp } from '@shared/historyApiTypes';
import { union } from 'lodash-es';
const console = consoleFactory(modulename);


/**
 *  Returns the players stats for the Players page callouts
 */
export default async function HistoryStats(ctx: AuthedCtx) {
    const sendTypedResp = (data: HistoryStatsResp) => ctx.send(data);
    try {
        const dbStats = txCore.database.stats.getActionStats();
        const dbAdmins = Object.keys(dbStats.groupedByAdmins);
        // @ts-ignore i don't wanna type this
        const vaultAdmins = txCore.adminStore.getAdminsList().map(a => a.name);
        const adminStats = union(dbAdmins, vaultAdmins)
            .sort((a, b) => a.localeCompare(b))
            .map(admin => ({
                name: admin,
                actions: dbStats.groupedByAdmins[admin] ?? 0
            }));
        return sendTypedResp({
            ...dbStats,
            groupedByAdmins: adminStats,
        });
    } catch (error) {
        const msg = `getStats failed with error: ${(error as Error).message}`;
        console.verbose.error(msg);
        return sendTypedResp({ error: msg });
    }
};
