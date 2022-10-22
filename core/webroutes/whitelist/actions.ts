const modulename = 'WebServer:WhitelistActions';
import logger from '@core/extras/console.js';
import { Context } from 'koa';
import { GenericApiResp } from '@shared/genericApiTypes';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

//Helper functions
const anyUndefined = (...args: any) => { return [...args].some((x) => (typeof x === 'undefined')); };



/**
 * Returns the output page containing the bans experiment
 */
export default async function WhitelistActions(ctx: Context) {
    //Sanity check
    if (anyUndefined(ctx.params.action)) {
        return ctx.utils.error(400, 'Invalid Request');
    }
    const action = ctx.params.action;
    const sendTypedResp = (data: GenericApiResp) => ctx.send(data);

    //Delegate to the specific action handler
    if (action === 'xxxxx') {
        return sendTypedResp(await handleXXXXX(ctx));
    } else if (action === 'yyyyyy') {
        return sendTypedResp(await handleXXXXX(ctx));
    } else {
        return sendTypedResp({ error: 'unknown action' });
    }
};


/**
 * Handle Save Note (open to all admins)
 */
async function handleXXXXX(ctx: Context): Promise<GenericApiResp> {
    throw new Error(`not ready yet`);
    //Checking request
    if (anyUndefined(
        ctx.request.body,
        ctx.request.body.note,
    )) {
        return { error: 'Invalid request.' };
    }
    const note = ctx.request.body.note.trim();

    try {
        player.setNote(note, sess.auth.username);
        ctx.utils.logAction(`Set notes for ${player.license}`);
        return { success: true };
    } catch (error) {
        return { error: `Failed to save note: ${(error as Error).message}` };
    }
}
