const modulename = 'WebServer:Intercom';
import { cloneDeep }  from 'lodash-es';
import { txEnv } from '@core/globalData';
import consoleFactory from '@extras/console';
import { InitializedCtx } from '@core/components/WebServer/ctxTypes';
const console = consoleFactory(modulename);


/**
 * Intercommunications endpoint
 * @param {object} ctx
 */
export default async function Intercom(ctx: InitializedCtx) {
    //Sanity check
    if ((typeof (ctx as any).params.scope !== 'string') || (ctx as any).request.body === undefined) {
        return ctx.utils.error(400, 'Invalid Request');
    }
    const scope = (ctx as any).params.scope as string;

    const postData = cloneDeep(ctx.request.body);
    postData.txAdminToken = true;

    //Delegate to the specific scope functions
    if (scope == 'monitor') {
        try {
            ctx.txAdmin.healthMonitor.handleHeartBeat('http', postData);
            return ctx.send(ctx.txAdmin.statsManager.txRuntime.currHbData);
        } catch (error) {
            return ctx.send({
                txAdminVersion: txEnv.txAdminVersion,
                success: false,
            });
        }
    } else if (scope == 'resources') {
        if (!Array.isArray(postData.resources)) {
            return ctx.utils.error(400, 'Invalid Request');
        }
        ctx.txAdmin.resourcesManager.tmpUpdateResourceList(postData.resources);
    } else {
        return ctx.send({
            type: 'danger',
            message: 'Unknown intercom scope.',
        });
    }

    return ctx.send({
        txAdminVersion: txEnv.txAdminVersion,
        success: false,
    });
};
