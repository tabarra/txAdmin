const modulename = 'WebServer:PlayerActions';
import humanizeDuration from 'humanize-duration';
import xssInstancer from '@core/extras/xss.js';
import logger from '@core/extras/console.js';
import { Context } from 'koa';
import playerResolver from '@core/playerLogic/playerResolver';
import { PlayerActionResp } from '@shared/playerApiTypes';
import { DatabasePlayer, ServerPlayer } from '@core/playerLogic/playerClasses';
const { dir, log, logOk, logWarn, logError } = logger(modulename);
const xss = xssInstancer();

//Helper functions
const now = () => { return Math.round(Date.now() / 1000); };
const anyUndefined = (...args: any) => { return [...args].some((x) => (typeof x === 'undefined')); };
const escape = (x: string) => { return x.replace(/"/g, '\uff02'); };
const formatCommand = (cmd: string, ...params: any) => {
    return `${cmd} "` + [...params].map((c) => c.toString()).map(escape).join('" "') + '"';
};



/**
 * Returns the output page containing the bans experiment
 */
export default async function PlayerActions(ctx: Context) {
    //Sanity check
    if (anyUndefined(ctx.params.action)) {
        return ctx.utils.error(400, 'Invalid Request');
    }
    const action = ctx.params.action;
    const sess = ctx.nuiSession ?? ctx.session;
    const { mutex, netid, license } = ctx.query;
    const sendTypedResp = (data: PlayerActionResp) => ctx.send(data);

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
    } else {
        return sendTypedResp({ error: 'unknown action' });
    }
};


//================================================================
/**
 * Handle Save Note (open to all admins)
 */
async function handleSaveNote(ctx: Context, sess: any, player: ServerPlayer | DatabasePlayer): Promise<PlayerActionResp> {
    //Checking request
    if (anyUndefined(
        ctx.request.body,
        ctx.request.body.note,
    )) {
        return { error: 'Invalid request.' };
    }
    const note = (ctx.request.body.note as string).trim();

    try {
        player.setNote(note, sess.auth.username);
        ctx.utils.logAction(`Set notes for ${player.license}`);
        return { success: true };
    } catch (error) {
        return { error: `Failed to save note: ${(error as Error).message}` };
    }
}


//================================================================
/**
 * Handle Send Warning
 */
async function handleWarning(ctx: Context, sess: any, player: ServerPlayer | DatabasePlayer): Promise<PlayerActionResp> {
    //Checking request
    if (anyUndefined(
        ctx.request.body,
        ctx.request.body.id,
        ctx.request.body.reason,
    )) {
        return { error: 'Invalid request.' };
    }
    const id = parseInt(ctx.request.body.id);
    if (Number.isNaN(id)) return ctx.send({ type: 'danger', message: 'Invalid ID.' });
    const reason = ctx.request.body.reason.trim();

    //Check permissions
    if (!ctx.utils.testPermission('players.warn', modulename)) {
        return { error: 'You don\'t have permission to execute this action.' }
    }

    //Register action (and checks if player is online)
    let actionId;
    try {
        actionId = await globals.playerController.registerAction(id, 'warn', sess.auth.username, reason);
    } catch (error) {
        return ctx.send({ type: 'danger', message: `<b>Error:</b> ${error.message}` });
    }
    ctx.utils.logAction(`Warned #${id}: ${reason}`);

    // Dispatch `txAdmin:events:playerWarned`
    const cmdOk = globals.fxRunner.sendEvent('playerWarned', {
        target: id,
        author: sess.auth.username,
        reason,
        actionId,
    });

    return ctx.send({
        type: cmdOk ? 'success' : 'danger',
        message: `Command sent!`,
    });
}


//================================================================
/**
 * Handle Banning command
 */
async function handleBan(ctx: Context, sess: any, player: ServerPlayer | DatabasePlayer): Promise<PlayerActionResp> {
    //Checking request & identifiers
    if (
        anyUndefined(
            ctx.request.body,
            ctx.request.body.duration,
            ctx.request.body.reference,
            ctx.request.body.reason,
        )
    ) {
        return { error: 'Invalid request.' };
    }
    let reference = ctx.request.body.reference;
    const inputDuration = ctx.request.body.duration.trim();
    const reason = ctx.request.body.reason.trim();

    //Converting ID to int
    if (typeof reference === 'string') {
        const intID = parseInt(reference);
        if (isNaN(intID)) {
            return ctx.send({ type: 'danger', message: 'You must send at least one identifier.' });
        } else {
            reference = intID;
        }
    }

    //Calculating expiration
    let expiration;
    let duration;
    if (inputDuration === 'permanent') {
        expiration = false;
    } else {
        const [multiplierInput, unit] = inputDuration.split(/\s+/);
        const multiplier = parseInt(multiplierInput);
        if (isNaN(multiplier) || multiplier < 1) {
            return ctx.send({ type: 'danger', message: 'The duration multiplier must be a number above 1.' });
        }

        if (unit.startsWith('hour')) {
            duration = multiplier * 3600;
        } else if (unit.startsWith('day')) {
            duration = multiplier * 86400;
        } else if (unit.startsWith('week')) {
            duration = multiplier * 604800;
        } else if (unit.startsWith('month')) {
            duration = multiplier * 2592000; //30 days
        } else {
            return ctx.send({ type: 'danger', message: 'Invalid ban duration. Supported units: hours, days, weeks, months' });
        }
        expiration = now() + duration;
    }

    //Check permissions
    if (!ctx.utils.testPermission('players.ban', modulename)) {
        return { error: 'You don\'t have permission to execute this action.' }
    }

    //Register action (and checks if player is online)
    let actionId;
    try {
        actionId = await globals.playerController.registerAction(reference, 'ban', sess.auth.username, reason, expiration);
    } catch (error) {
        return ctx.send({ type: 'danger', message: `<b>Error:</b> ${error.message}` });
    }

    //Prepare and send command
    let msg;
    const tOptions = {
        author: xss(sess.auth.username),
        reason: xss(reason),
    };
    if (expiration !== false) {
        const humanizeOptions = {
            language: globals.translator.t('$meta.humanizer_language'),
            round: true,
            units: ['d', 'h'],
        };
        tOptions.expiration = humanizeDuration((duration) * 1000, humanizeOptions);
        msg = '[txAdmin] ' + globals.translator.t('ban_messages.kick_temporary', tOptions);
    } else {
        msg = '[txAdmin] ' + globals.translator.t('ban_messages.kick_permanent', tOptions);
    }

    let cmd, referenceType;
    if (Array.isArray(reference)) {
        referenceType = 'Identifiers';
        cmd = formatCommand('txaDropIdentifiers', reference.join(';'), msg);
        ctx.utils.logAction(`Banned <${reference.join(';')}>: ${reason}`);
    } else if (Number.isInteger(reference)) {
        referenceType = 'Player';
        cmd = formatCommand('txaKickID', reference, msg);
        ctx.utils.logAction(`Banned #${reference}: ${reason}`);
    } else {
        return ctx.send({ type: 'danger', message: '<b>Error:</b> unknown reference type' });
    }

    // Dispatch `txAdmin:events:playerBanned`
    globals.fxRunner.sendEvent('playerBanned', {
        author: sess.auth.username,
        reason,
        actionId,
        target: reference,
        expiration
    });

    const writeResult = await globals.fxRunner.srvCmd(cmd);
    ctx.send({
        type: 'success',
        message: `${referenceType} banned.`,
    });
}


//================================================================
/**
 * Handle Whitelist Action
 */
async function handleSetWhitelist(ctx: Context, sess: any, player: ServerPlayer | DatabasePlayer): Promise<PlayerActionResp> {
    //Checking request
    if (anyUndefined(
        ctx.request.body,
        ctx.request.body.status,
    )) {
        return { error: 'Invalid request.' };
    }
    const status = (ctx.request.body.status === 'true');

    //Check permissions
    if (!ctx.utils.testPermission('players.whitelist', modulename)) {
        return { error: 'You don\'t have permission to execute this action.' }
    }

    try {
        player.setWhitelist(status);
        if(status){
            ctx.utils.logAction(`Added ${player.license} to the whitelist.`);
        }else{
            ctx.utils.logAction(`Removed ${player.license} from the whitelist.`);
        }

        // Dispatch `txAdmin:events:playerWhitelisted`
        //FIXME:
        // globals.fxRunner.sendEvent('playerWhitelisted', {
        //     license: player.license,
        //     author: sess.auth.username,
        //     status,
        // });

        return { success: true };
    } catch (error) {
        return { error: `Failed to save whitelist status: ${(error as Error).message}` };
    }
}
