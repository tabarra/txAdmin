const modulename = 'WebServer:Intercom';
import { cloneDeep }  from 'lodash-es';
import { convars, txEnv } from '@core/globalData';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined'); };


/**
 * Intercommunications endpoint
 * @param {object} ctx
 */
export default async function Intercom(ctx) { //TODO: type with InitializedCtx
    //Sanity check
    if (isUndefined(ctx.params.scope)) {
        return ctx.utils.error(400, 'Invalid Request');
    }
    const scope = ctx.params.scope;

    const postData = cloneDeep(ctx.request.body);
    postData.txAdminToken = true;

    //Delegate to the specific scope functions
    if (scope == 'monitor') {
        try {
            globals.healthMonitor.handleHeartBeat('http', postData);
            return ctx.send(globals.statsManager.txRuntime.currHbData);
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
        globals.resourcesManager.tmpUpdateResourceList(postData.resources);
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
