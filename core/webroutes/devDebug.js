const modulename = 'WebServer:DevDebug';
import logger from '@core/extras/console.js';
import { convars } from '@core/globalData';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

//DEBUG
const {Console} = require('node:console');
const ogConsole = new Console({
    stdout: process.stdout,
    stderr: process.stderr,
    colorMode: true,
});

const devWarningMessage = 'The privileged /dev was called. This webroute is unsafe and only enabled in developer mode.';

/**
 * Handler for the GET calls
 * @param {object} ctx
 */
export const get = async (ctx) => {
    //Sanity check
    logWarn(devWarningMessage);
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
    logWarn(devWarningMessage);
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
            dir(error);
        }

    } else {
        dir(scope);
        dir(ctx.request.body);
        return ctx.send({ error: 'unknown scope' });
    }
};
