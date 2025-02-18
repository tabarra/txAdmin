const modulename = 'WebServer:DevDebug';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import { txDevEnv } from '@core/globalData';
import consoleFactory from '@lib/console';
import { z } from 'zod';
const console = consoleFactory(modulename);


//Helpers
const devWarningMessage = 'The unsafe privileged /dev webroute was called and should only be used in developer mode.';
const paramsSchema = z.object({
    scope: z.string(),
});
let playerJoinCounter = 0;


/**
 * Handler for the GET calls
 */
export const get = async (ctx: AuthedCtx) => {
    //Sanity check
    if (!txDevEnv.ENABLED) return ctx.send({ error: 'this route is dev mode only' });
    const schemaRes = paramsSchema.safeParse(ctx.params);
    if (!schemaRes.success) return ctx.utils.error(400, 'Invalid Request');
    console.warn(devWarningMessage);
    const { scope } = schemaRes.data;

    return ctx.send({
        rand: Math.random()
    });
};


/**
 * Handler for the POST calls
 */
export const post = async (ctx: AuthedCtx) => {
    //Sanity check
    if (!txDevEnv.ENABLED) return ctx.send({ error: 'this route is dev mode only' });
    const schemaRes = paramsSchema.safeParse(ctx.params);
    if (!schemaRes.success) return ctx.utils.error(400, 'Invalid Request');
    console.warn(devWarningMessage);
    const { scope } = schemaRes.data;

    if (scope === 'event') {
        try {
            if(!txCore.fxRunner.child?.isAlive){
                return ctx.send({ error: 'server not ready' });
            }
            if (ctx.request.body.id === null) {
                if (ctx.request.body.event === 'playerDropped') {
                    const onlinePlayers = txCore.fxPlayerlist.getPlayerList();
                    if (onlinePlayers.length){
                        ctx.request.body.id = onlinePlayers[0].netid;
                    }
                } else if (ctx.request.body.event === 'playerJoining') {
                    ctx.request.body.id = playerJoinCounter + 101;
                }
            }
            if (ctx.request.body.event === 'playerJoining') {
                playerJoinCounter++;
            }
            txCore.fxPlayerlist.handleServerEvents(ctx.request.body, txCore.fxRunner.child.mutex);
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
