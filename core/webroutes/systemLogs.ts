import { getLogBuffer } from '@extras/console';
import type { AuthedCtx } from '@core/components/WebServer/ctxTypes';
import type { GenericApiErrorResp } from '@shared/genericApiTypes';


/**
 * Returns the data of for the system logs pages (console/actions)
 * NOTE: would be more efficient to return the raw string, but the frontend fetcher expects JSON
 */
export default async function SystemLogs(ctx: AuthedCtx) {
    const { scope } = ctx.params as any;
    const sendTypedResp = (data: { data: string } | GenericApiErrorResp) => ctx.send(data);

    //Check permissions
    if (!ctx.admin.hasPermission('txadmin.log.view')) {
        return sendTypedResp({ error: 'You don\'t have permission to call this endpoint.' });
    }

    //Returning the data
    if (scope === 'console') {
        return sendTypedResp({
            data: getLogBuffer(),
        });
    } else if (scope === 'action') {
        const rawActions = await ctx.txAdmin.logger.admin.getRecentBuffer();
        if (!rawActions) return sendTypedResp({ error: 'Error fetching actions' });
        return sendTypedResp({
            data: rawActions,
        });
    } else {
        return sendTypedResp({ error: 'Invalid scope' });
    }
};
