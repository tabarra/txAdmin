const modulename = 'WebServer:DatabaseActions';
import { GenericApiResp } from '@shared/genericApiTypes';
import logger from '@core/extras/console.js';
import { Context } from 'koa';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

//Helper functions
const anyUndefined = (...args: any) => { return [...args].some((x) => (typeof x === 'undefined')); };


/**
 * Returns the resources list
 * @param {object} ctx
 */
export default async function DatabaseActions(ctx: Context) {
    //Sanity check
    if (!ctx.params?.action) {
        return ctx.utils.error(400, 'Invalid Request');
    }
    const action = ctx.params.action;
    const sess = ctx.nuiSession ?? ctx.session; //revoke_action can be triggered by the menu player modal
    const sendTypedResp = (data: GenericApiResp) => ctx.send(data);


    //Delegate to the specific action handler
    if (action === 'ban_ids') {
        return sendTypedResp(await handleBandIds(ctx, sess));
    } else if (action === 'revoke_action') {
        return sendTypedResp(await handleRevokeAction(ctx, sess));
    } else {
        return sendTypedResp({ error: 'unknown action' });
    }
};


/**
 * Handle Ban Player IDs (legacy ban!)
 * This is only called from the players page, where you ban an ID array instead of a PlayerClass
 */
async function handleBandIds(ctx: Context, sess: any): Promise<GenericApiResp> {
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


/**
 * Handle revoke database action.
 * This is called from the player modal or the players page.
 */
async function handleRevokeAction(ctx: Context, sess: any): Promise<GenericApiResp> {
    //Checking request
    if (anyUndefined(
        ctx.request.body,
        ctx.request.body.action_id,
    )) {
        return { error: 'Invalid request.' };
    }
    const action_id = ctx.request.body.action_id.trim();

    //Check permissions
    const perms = [];
    if (ctx.utils.hasPermission('players.ban')) perms.push('ban');
    if (ctx.utils.hasPermission('players.warn')) perms.push('warn');

    try {
        const action = globals.playerDatabase.revokeAction(action_id, sess.auth.username, perms);
        ctx.utils.logAction(`Revoked ${action.type} id ${action_id} from ${action.playerName ?? 'identifiers'}`);

        dir(action)
        //FIXME: send actionRevoked event
        
        return { success: true };
    } catch (error) {
        return { error: `Failed to revoke action: ${(error as Error).message}` };
    }
}
