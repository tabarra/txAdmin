const modulename = 'WebServer:DevDebug';
import { convars } from '@core/globalData';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);


const devWarningMessage = 'The privileged /dev was called. This webroute is unsafe and only enabled in developer mode.';

/**
 * Handler for the GET calls
 * @param {object} ctx
 */
export const get = async (ctx) => {
    //Sanity check
    console.warn(devWarningMessage);
    if (!convars.isDevMode) { return ctx.send({ error: 'this route is dev mode only' }); }
    if (!ctx?.params?.scope) { return ctx.utils.error(400, 'Invalid Request'); }
    const scope = ctx.params.scope;

    return ctx.send({
        rand: Math.random()
    });
};


/**
 * Handler for the POST calls
 * @param {object} ctx
 */
export const post = async (ctx) => {
    //Sanity check
    console.warn(devWarningMessage);
    if (!convars.isDevMode) { return ctx.send({ error: 'this route is dev mode only' }); }
    if (!ctx?.params?.scope) { return ctx.utils.error(400, 'Invalid Request'); }
    const scope = ctx.params.scope;

    if (scope === 'event') {
        try {
            if(!globals.fxRunner.currentMutex){
                return ctx.send({ error: 'server not ready' });
            }
            globals.playerlistManager.handleServerEvents(ctx.request.body, globals.fxRunner.currentMutex);
            return ctx.send({ success: true });
        } catch (error) {
            console.dir(error);
        }

    } else {
        console.dir(scope);
        console.dir(ctx.request.body);
        return ctx.send({ error: 'unknown scope' });
    }
};
