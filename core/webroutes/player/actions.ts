const modulename = 'WebServer:PlayerActions';
import humanizeDuration, { Unit } from 'humanize-duration';
import playerResolver from '@core/playerLogic/playerResolver';
import { GenericApiResp } from '@shared/genericApiTypes';
import { PlayerClass, ServerPlayer } from '@core/playerLogic/playerClasses';
import { anyUndefined, calcExpirationFromDuration } from '@core/extras/helpers';
import consoleFactory from '@extras/console';
import { AuthedCtx } from '@core/components/WebServer/ctxTypes';
const console = consoleFactory(modulename);


/**
 * Actions route for the player modal
 */
export default async function PlayerActions(ctx: AuthedCtx) {
    //Sanity check
    if (anyUndefined(ctx.params.action)) {
        return ctx.utils.error(400, 'Invalid Request');
    }
    const action = ctx.params.action;
    const { mutex, netid, license } = ctx.query;
    const sendTypedResp = (data: GenericApiResp) => ctx.send(data);

    //Finding the player
    let player;
    try {
        const refMutex = (mutex === 'current') ? ctx.txAdmin.fxRunner.currentMutex : mutex;
        player = playerResolver(refMutex, parseInt((netid as string)), license);
    } catch (error) {
        return sendTypedResp({ error: (error as Error).message });
    }

    //Delegate to the specific action handler
    if (action === 'save_note') {
        return sendTypedResp(await handleSaveNote(ctx, player));
    } else if (action === 'warn') {
        return sendTypedResp(await handleWarning(ctx, player));
    } else if (action === 'ban') {
        return sendTypedResp(await handleBan(ctx, player));
    } else if (action === 'whitelist') {
        return sendTypedResp(await handleSetWhitelist(ctx, player));
    } else if (action === 'message') {
        return sendTypedResp(await handleDirectMessage(ctx, player));
    } else if (action === 'kick') {
        return sendTypedResp(await handleKick(ctx, player));
    } else {
        return sendTypedResp({ error: 'unknown action' });
    }
};


/**
 * Handle Save Note (open to all admins)
 */
async function handleSaveNote(ctx: AuthedCtx, player: PlayerClass): Promise<GenericApiResp> {
    //Checking request
    if (anyUndefined(
        ctx.request.body,
        ctx.request.body.note,
    )) {
        return { error: 'Invalid request.' };
    }
    const note = ctx.request.body.note.trim();

    try {
        player.setNote(note, ctx.admin.name);
        ctx.admin.logAction(`Set notes for ${player.license}`);
        return { success: true };
    } catch (error) {
        return { error: `Failed to save note: ${(error as Error).message}` };
    }
}


/**
 * Handle Send Warning
 */
async function handleWarning(ctx: AuthedCtx, player: PlayerClass): Promise<GenericApiResp> {
    //Checking request
    if (anyUndefined(
        ctx.request.body,
        ctx.request.body.reason,
    )) {
        return { error: 'Invalid request.' };
    }
    const reason = ctx.request.body.reason.trim() || 'no reason provided';

    //Check permissions
    if (!ctx.admin.testPermission('players.warn', modulename)) {
        return { error: 'You don\'t have permission to execute this action.' };
    }

    //Validating server & player
    const allIds = player.getAllIdentifiers();
    if (!allIds.length) {
        return { error: 'Cannot warn a player with no identifiers.' };
    }

    //Register action
    let actionId;
    try {
        actionId = ctx.txAdmin.playerDatabase.registerWarnAction(
            allIds,
            ctx.admin.name,
            reason,
            player.displayName,
        );
    } catch (error) {
        return { error: `Failed to warn player: ${(error as Error).message}` };
    }
    ctx.admin.logAction(`Warned player ${player.displayName}: ${reason}`);

    // Dispatch `txAdmin:events:playerWarned`
    const cmdOk = ctx.txAdmin.fxRunner.sendEvent('playerWarned', {
        author: ctx.admin.name,
        reason,
        actionId,
        targetNetId: (player instanceof ServerPlayer && player.isConnected) ? player.netid : null,
        targetIds: allIds,
        targetName: player.displayName,
    });

    if (cmdOk) {
        return { success: true };
    } else {
        return { error: `Warn saved, but likely failed to send the warn in game (stdin error).` };
    }
}


/**
 * Handle Banning command
 */
async function handleBan(ctx: AuthedCtx, player: PlayerClass): Promise<GenericApiResp> {
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
    if (!ctx.admin.testPermission('players.ban', modulename)) {
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
        actionId = ctx.txAdmin.playerDatabase.registerBanAction(
            allIds,
            ctx.admin.name,
            reason,
            expiration,
            player.displayName,
            allHwids
        );
    } catch (error) {
        return { error: `Failed to ban player: ${(error as Error).message}` };
    }
    ctx.admin.logAction(`Banned player ${player.displayName}: ${reason}`);

    //No need to dispatch events if server is not online
    if (ctx.txAdmin.fxRunner.fxChild === null) {
        return { success: true };
    }

    //Prepare and send command
    let kickMessage, durationTranslated;
    const tOptions: any = {
        author: ctx.txAdmin.adminVault.getAdminPublicName(ctx.admin.name, 'punishment'),
        reason: reason,
    };
    if (expiration !== false && duration) {
        const humanizeOptions = {
            language: ctx.txAdmin.translator.t('$meta.humanizer_language'),
            round: true,
            units: ['d', 'h'] as Unit[],
        };
        durationTranslated = humanizeDuration((duration) * 1000, humanizeOptions);
        tOptions.expiration = durationTranslated;
        kickMessage = ctx.txAdmin.translator.t('ban_messages.kick_temporary', tOptions);
    } else {
        durationTranslated = null;
        kickMessage = ctx.txAdmin.translator.t('ban_messages.kick_permanent', tOptions);
    }

    // Dispatch `txAdmin:events:playerBanned`
    const cmdOk = ctx.txAdmin.fxRunner.sendEvent('playerBanned', {
        author: ctx.admin.name,
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
        return { error: `Player banned, but likely failed to kick player (stdin error).` };
    }
}


/**
 * Handle Player Whitelist Action
 */
async function handleSetWhitelist(ctx: AuthedCtx, player: PlayerClass): Promise<GenericApiResp> {
    //Checking request
    if (anyUndefined(
        ctx.request.body,
        ctx.request.body.status,
    )) {
        return { error: 'Invalid request.' };
    }
    const status = (ctx.request.body.status === 'true' || ctx.request.body.status === true);

    //Check permissions
    if (!ctx.admin.testPermission('players.whitelist', modulename)) {
        return { error: 'You don\'t have permission to execute this action.' }
    }

    try {
        player.setWhitelist(status);
        if (status) {
            ctx.admin.logAction(`Added ${player.license} to the whitelist.`);
        } else {
            ctx.admin.logAction(`Removed ${player.license} from the whitelist.`);
        }

        //No need to dispatch events if server is not online
        if (ctx.txAdmin.fxRunner.fxChild === null) {
            return { success: true };
        }

        ctx.txAdmin.fxRunner.sendEvent('whitelistPlayer', {
            action: status ? 'added' : 'removed',
            license: player.license,
            playerName: player.displayName,
            adminName: ctx.admin.name,
        });

        return { success: true };
    } catch (error) {
        return { error: `Failed to save whitelist status: ${(error as Error).message}` };
    }
}


/**
 * Handle Direct Message Action
 */
async function handleDirectMessage(ctx: AuthedCtx, player: PlayerClass): Promise<GenericApiResp> {
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
    if (!ctx.admin.testPermission('players.direct_message', modulename)) {
        return { error: 'You don\'t have permission to execute this action.' };
    }

    //Validating server & player
    if (ctx.txAdmin.fxRunner.fxChild === null) {
        return { error: 'The server is not online.' };
    }
    if (!(player instanceof ServerPlayer) || !player.isConnected) {
        return { error: 'This player is not connected to the server.' };
    }

    try {
        ctx.admin.logAction(`DM to ${player.displayName}: ${message}`);

        // Dispatch `txAdmin:events:playerDirectMessage`
        ctx.txAdmin.fxRunner.sendEvent('playerDirectMessage', {
            target: player.netid,
            author: ctx.admin.name,
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
async function handleKick(ctx: AuthedCtx, player: PlayerClass): Promise<GenericApiResp> {
    //Checking request
    if (anyUndefined(
        ctx.request.body,
        ctx.request.body.reason,
    )) {
        return { error: 'Invalid request.' };
    }
    const kickReason = ctx.request.body.reason.trim() || ctx.txAdmin.translator.t('kick_messages.unknown_reason');

    //Check permissions
    if (!ctx.admin.testPermission('players.kick', modulename)) {
        return { error: 'You don\'t have permission to execute this action.' };
    }

    //Validating server & player
    if (ctx.txAdmin.fxRunner.fxChild === null) {
        return { error: 'The server is offline.' };
    }
    if (!(player instanceof ServerPlayer) || !player.isConnected) {
        return { error: 'This player is not connected to the server.' };
    }

    try {
        ctx.admin.logAction(`Kicked ${player.displayName}: ${kickReason}`);
        const fullReason = ctx.txAdmin.translator.t(
            'kick_messages.player',
            { reason: kickReason }
        );

        // Dispatch `txAdmin:events:playerKicked`
        ctx.txAdmin.fxRunner.sendEvent('playerKicked', {
            target: player.netid,
            author: ctx.admin.name,
            reason: fullReason,
        });

        return { success: true };
    } catch (error) {
        return { error: `Failed to save kick player: ${(error as Error).message}` };
    }
}
