const modulename = 'WebServer:PlayerActions';
import humanizeDuration, { Unit } from 'humanize-duration';
import { Context } from 'koa';
import playerResolver from '@core/playerLogic/playerResolver';
import { GenericApiResp } from '@shared/genericApiTypes';
import { PlayerClass, ServerPlayer } from '@core/playerLogic/playerClasses';
import { anyUndefined, calcExpirationFromDuration } from '@core/extras/helpers';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);


/**
 * Actions route for the player modal
 */
export default async function PlayerActions(ctx: Context) {
    //Sanity check
    if (anyUndefined(ctx.params.action)) {
        return ctx.utils.error(400, 'Invalid Request');
    }
    const action = ctx.params.action;
    const sess = ctx.nuiSession ?? ctx.session;
    const { mutex, netid, license } = ctx.query;
    const sendTypedResp = (data: GenericApiResp) => ctx.send(data);

    //Finding the player
    let player;
    try {
        const refMutex = (mutex === 'current') ? globals.fxRunner.currentMutex : mutex;
        player = playerResolver(refMutex, parseInt((netid as string)), license);
    } catch (error) {
        return sendTypedResp({ error: (error as Error).message });
    }

    //Delegate to the specific action handler
    if (action === 'save_note') {
        return sendTypedResp(await handleSaveNote(ctx, sess, player));
    } else if (action === 'warn') {
        return sendTypedResp(await handleWarning(ctx, sess, player));
    } else if (action === 'ban') {
        return sendTypedResp(await handleBan(ctx, sess, player));
    } else if (action === 'whitelist') {
        return sendTypedResp(await handleSetWhitelist(ctx, sess, player));
    } else if (action === 'message') {
        return sendTypedResp(await handleMessage(ctx, sess, player));
    } else if (action === 'kick') {
        return sendTypedResp(await handleKick(ctx, sess, player));
    } else {
        return sendTypedResp({ error: 'unknown action' });
    }
};


/**
 * Handle Save Note (open to all admins)
 */
async function handleSaveNote(ctx: Context, sess: any, player: PlayerClass): Promise<GenericApiResp> {
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
 * Handle Send Warning
 */
async function handleWarning(ctx: Context, sess: any, player: PlayerClass): Promise<GenericApiResp> {
    //Checking request
    if (anyUndefined(
        ctx.request.body,
        ctx.request.body.reason,
    )) {
        return { error: 'Invalid request.' };
    }
    const reason = ctx.request.body.reason.trim() || 'no reason provided';

    //Check permissions
    if (!ctx.utils.testPermission('players.warn', modulename)) {
        return { error: 'You don\'t have permission to execute this action.' };
    }

    //Validating server & player
    if (globals.fxRunner.fxChild === null) {
        return { error: 'The server is not online.' };
    }
    if (!(player instanceof ServerPlayer) || !player.isConnected) {
        return { error: 'This player is not connected to the server.' };
    }
    const allIds = player.getAllIdentifiers();
    if (!allIds.length) {
        return { error: 'Cannot warn a player with no identifiers.' };
    }

    //Register action
    let actionId;
    try {
        actionId = globals.playerDatabase.registerAction(
            allIds,
            'warn',
            sess.auth.username,
            reason,
            false,
            player.displayName
        );
    } catch (error) {
        return { error: `Failed to warn player: ${(error as Error).message}` };
    }
    ctx.utils.logAction(`Warned player [${player.netid}] ${player.displayName}: ${reason}`);

    // Dispatch `txAdmin:events:playerWarned`
    const cmdOk = globals.fxRunner.sendEvent('playerWarned', {
        target: player.netid,
        author: sess.auth.username,
        reason,
        actionId,
    });

    if (cmdOk) {
        return { success: true };
    } else {
        return { error: `Failed to warn player (stdin error).` };
    }
}


/**
 * Handle Banning command
 */
async function handleBan(ctx: Context, sess: any, player: PlayerClass): Promise<GenericApiResp> {
    //Checking request
    if (
        anyUndefined(
            ctx.request.body,
            ctx.request.body.duration,
            ctx.request.body.reason,
        )
    ) {
        return { error: 'Invalid request.' };
    }
    const durationInput = ctx.request.body.duration.trim();
    const reason = (ctx.request.body.reason as string).trim() || 'no reason provided';

    //Calculating expiration/duration
    let calcResults;
    try {
        calcResults = calcExpirationFromDuration(durationInput);
    } catch (error) {
        return { error: (error as Error).message };
    }
    const { expiration, duration } = calcResults;

    //Check permissions
    if (!ctx.utils.testPermission('players.ban', modulename)) {
        return { error: 'You don\'t have permission to execute this action.' }
    }

    //Validating player - hwids.length can be zero 
    const allIds = player.getAllIdentifiers();
    const allHwids = player.getAllHardwareIdentifiers();
    if (!allIds.length) {
        return { error: 'Cannot ban a player with no identifiers.' }
    }

    //Register action
    let actionId;
    try {
        actionId = globals.playerDatabase.registerAction(
            allIds,
            'ban',
            sess.auth.username,
            reason,
            expiration,
            player.displayName,
            allHwids
        );
    } catch (error) {
        return { error: `Failed to ban player: ${(error as Error).message}` };
    }
    ctx.utils.logAction(`Banned player ${player.displayName}: ${reason}`);

    //No need to dispatch events if server is not online
    if (globals.fxRunner.fxChild === null) {
        return { success: true };
    }

    //Prepare and send command
    let kickMessage, durationTranslated;
    const tOptions: any = {
        author: sess.auth.username,
        reason: reason,
    };
    if (expiration !== false && duration) {
        const humanizeOptions = {
            language: globals.translator.t('$meta.humanizer_language'),
            round: true,
            units: ['d', 'h'] as Unit[],
        };
        durationTranslated = humanizeDuration((duration) * 1000, humanizeOptions);
        tOptions.expiration = durationTranslated;
        kickMessage = globals.translator.t('ban_messages.kick_temporary', tOptions);
    } else {
        durationTranslated = null;
        kickMessage = globals.translator.t('ban_messages.kick_permanent', tOptions);
    }

    // Dispatch `txAdmin:events:playerBanned`
    const cmdOk = globals.fxRunner.sendEvent('playerBanned', {
        author: sess.auth.username,
        reason,
        actionId,
        expiration,
        durationInput,
        durationTranslated,
        targetNetId: (player instanceof ServerPlayer) ? player.netid : null,
        targetIds: player.ids,
        targetHwids: player.hwids,
        targetName: player.displayName,
        kickMessage,
    });

    if (cmdOk) {
        return { success: true };
    } else {
        return { error: `Failed to ban player (stdin error).` };
    }
}


/**
 * Handle Player Whitelist Action
 */
async function handleSetWhitelist(ctx: Context, sess: any, player: PlayerClass): Promise<GenericApiResp> {
    //Checking request
    if (anyUndefined(
        ctx.request.body,
        ctx.request.body.status,
    )) {
        return { error: 'Invalid request.' };
    }
    const status = (ctx.request.body.status === 'true' || ctx.request.body.status === true);

    //Check permissions
    if (!ctx.utils.testPermission('players.whitelist', modulename)) {
        return { error: 'You don\'t have permission to execute this action.' }
    }

    try {
        player.setWhitelist(status);
        if (status) {
            ctx.utils.logAction(`Added ${player.license} to the whitelist.`);
        } else {
            ctx.utils.logAction(`Removed ${player.license} from the whitelist.`);
        }

        //No need to dispatch events if server is not online
        if (globals.fxRunner.fxChild === null) {
            return { success: true };
        }

        globals.fxRunner.sendEvent('whitelistPlayer', {
            action: status ? 'added' : 'removed',
            license: player.license,
            playerName: player.displayName,
            adminName: sess.auth.username,
        });

        return { success: true };
    } catch (error) {
        return { error: `Failed to save whitelist status: ${(error as Error).message}` };
    }
}


/**
 * Handle Direct Message Action
 */
async function handleMessage(ctx: Context, sess: any, player: PlayerClass): Promise<GenericApiResp> {
    //Checking request
    if (anyUndefined(
        ctx.request.body,
        ctx.request.body.message,
    )) {
        return { error: 'Invalid request.' };
    }
    const message = ctx.request.body.message.trim();
    if (!message.length) {
        return { error: 'Cannot send a DM with empty message.' };
    }

    //Check permissions
    if (!ctx.utils.testPermission('players.message', modulename)) {
        return { error: 'You don\'t have permission to execute this action.' };
    }

    //Validating server & player
    if (globals.fxRunner.fxChild === null) {
        return { error: 'The server is not online.' };
    }
    if (!(player instanceof ServerPlayer) || !player.isConnected) {
        return { error: 'This player is not connected to the server.' };
    }

    try {
        ctx.utils.logAction(`DM to #${player.displayName}: ${message}`);

        // Dispatch `txAdmin:events:playerDirectMessage`
        globals.fxRunner.sendEvent('playerDirectMessage', {
            target: player.netid,
            author: sess.auth.username,
            message,
        });

        return { success: true };
    } catch (error) {
        return { error: `Failed to save dm player: ${(error as Error).message}` };
    }
}


/**
 * Handle Kick Action
 */
async function handleKick(ctx: Context, sess: any, player: PlayerClass): Promise<GenericApiResp> {
    //Checking request
    if (anyUndefined(
        ctx.request.body,
        ctx.request.body.reason,
    )) {
        return { error: 'Invalid request.' };
    }
    const reason = ctx.request.body.reason.trim() || 'no reason provided';

    //Check permissions
    if (!ctx.utils.testPermission('players.kick', modulename)) {
        return { error: 'You don\'t have permission to execute this action.' };
    }

    //Validating server & player
    if (globals.fxRunner.fxChild === null) {
        return { error: 'The server is not online.' };
    }
    if (!(player instanceof ServerPlayer) || !player.isConnected) {
        return { error: 'This player is not connected to the server.' };
    }

    try {
        ctx.utils.logAction(`Kicked #${player.displayName}: ${reason}`);

        // Dispatch `txAdmin:events:playerKicked`
        globals.fxRunner.sendEvent('playerKicked', {
            target: player.netid,
            author: sess.auth.username,
            reason,
        });

        return { success: true };
    } catch (error) {
        return { error: `Failed to save kick player: ${(error as Error).message}` };
    }
}
