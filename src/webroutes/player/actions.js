//Requires
const modulename = 'WebServer:PlayerActions';
const humanizeDuration = require('humanize-duration');
const xss = require('../../extras/xss')();
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Helper functions
const now = () => { return Math.round(Date.now() / 1000); };
const anyUndefined = (...args) => { return [...args].some((x) => (typeof x === 'undefined')); };
const escape = (x) => {return x.replace(/"/g, '\uff02');};
const formatCommand = (cmd, ...params) => {
    return `${cmd} "` + [...params].map((c) => c.toString()).map(escape).join('" "') + '"';
};
function ensurePermission(ctx, perm) {
    if (ctx.utils.checkPermission(perm, modulename)) {
        return true;
    } else {
        ctx.send({
            type: 'danger',
            message: 'You don\'t have permission to execute this action.',
        });
        return false;
    }
}
function sendAlertOutput(ctx, toResp, header = 'Output:') {
    toResp = (toResp.length) ? xss(toResp) : 'no output';
    return ctx.send({
        type: 'warning',
        message: `<b>${header}</b><br> <pre>${toResp}</pre>`,
    });
}


/**
 * Returns the output page containing the bans experiment
 * @param {object} ctx
 * @param {object} sess
 */
module.exports = async function PlayerActions(ctx) {
    //Sanity check
    if (anyUndefined(ctx.params.action)) {
        return ctx.utils.error(400, 'Invalid Request');
    }
    const action = ctx.params.action;
    const sess = ctx.nuiSession ?? ctx.session;

    //Delegate to the specific action handler
    if (action === 'save_note') {
        return await handleSaveNote(ctx, sess);
    } else if (action === 'message') {
        return await handleMessage(ctx, sess);
    } else if (action === 'kick') {
        return await handleKick(ctx, sess);
    } else if (action === 'warn') {
        return await handleWarning(ctx, sess);
    } else if (action === 'ban') {
        return await handleBan(ctx, sess);
    } else if (action === 'whitelist') {
        return await handleWhitelist(ctx, sess);
    } else if (action === 'revoke_action') {
        return await handleRevokeAction(ctx, sess);
    } else {
        return ctx.send({
            type: 'danger',
            message: 'Unknown action.',
        });
    }
};


//================================================================
/**
 * Handle Save Note (open to all admins)
 * @param {object} ctx
 * @param {object} sess
 */
async function handleSaveNote(ctx, sess) {
    //Checking request
    if (anyUndefined(
        ctx.request.body,
        ctx.request.body.note,
        ctx.request.body.license,
    )) {
        return ctx.send({type: 'danger', message: 'Invalid request.'});
    }
    const license = ctx.request.body.license.trim();
    const note = ctx.request.body.note.trim();

    try {
        const success = await globals.playerController.setPlayerNote(license, note, sess.auth.username);
        if (success) {
            return ctx.send({
                type: 'success',
                message: 'Saved!',
            });
        } else {
            return ctx.send({
                type: 'danger',
                message: 'failed to save note.',
            });
        }
    } catch (error) {
        return ctx.send({
            type: 'danger',
            message: `Failed to save with error: ${error.message}`,
        });
    }
}


//================================================================
/**
 * Handle Send Message (admin dm)
 * @param {object} ctx
 * @param {object} sess
 */
async function handleMessage(ctx, sess) {
    //Checking request
    if (anyUndefined(
        ctx.request.body,
        ctx.request.body.id,
        ctx.request.body.message,
    )) {
        return ctx.send({type: 'danger', message: 'Invalid request.'});
    }
    const id = ctx.request.body.id;
    const message = ctx.request.body.message.trim();

    //Check permissions
    if (!ensurePermission(ctx, 'players.message')) return false;

    //Prepare and send command
    ctx.utils.logAction(`DM to #${id}: ${message}`);
    const cmd = formatCommand('txaSendDM', id, sess.auth.username, message);
    const toResp = await globals.fxRunner.srvCmdBuffer(cmd);
    return sendAlertOutput(ctx, toResp);
}


//================================================================
/**
 * Handle Kick Player
 * @param {object} ctx
 * @param {object} sess
 */
async function handleKick(ctx, sess) {
    //Checking request
    if (anyUndefined(
        ctx.request.body,
        ctx.request.body.id,
        ctx.request.body.reason,
    )) {
        return ctx.send({type: 'danger', message: 'Invalid request.'});
    }
    const id = ctx.request.body.id;
    const reason = ctx.request.body.reason.trim() || 'no reason provided';

    //Check permissions
    if (!ensurePermission(ctx, 'players.kick')) return false;

    //Prepare and send command
    ctx.utils.logAction(`Kicked #${id}: ${reason}`);
    const msg = `[txAdmin] (${xss(sess.auth.username)}) Kick reason: ${xss(reason)}`;
    const cmd = formatCommand('txaKickID', id, msg);
    const toResp = await globals.fxRunner.srvCmdBuffer(cmd);

    // Dispatch `txAdmin:events:playerKicked`
    globals.fxRunner.sendEvent('playerKicked', {
        target: id,
        author: sess.auth.username,
        reason,
    });

    return sendAlertOutput(ctx, toResp);
}


//================================================================
/**
 * Handle Send Warning
 * @param {object} ctx
 * @param {object} sess
 */
async function handleWarning(ctx, sess) {
    //Checking request
    if (anyUndefined(
        ctx.request.body,
        ctx.request.body.id,
        ctx.request.body.reason,
    )) {
        return ctx.send({type: 'danger', message: 'Invalid request.'});
    }
    const id = parseInt(ctx.request.body.id);
    if (Number.isNaN(id)) return ctx.send({type: 'danger', message: 'Invalid ID.'});
    const reason = ctx.request.body.reason.trim();

    //Check permissions
    if (!ensurePermission(ctx, 'players.warn')) return false;

    //Register action (and checks if player is online)
    let actionId;
    try {
        actionId = await globals.playerController.registerAction(id, 'warn', sess.auth.username, reason);
    } catch (error) {
        return ctx.send({type: 'danger', message: `<b>Error:</b> ${error.message}`});
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
 * @param {object} ctx
 * @param {object} sess
 */
async function handleBan(ctx, sess) {
    //Checking request & identifiers
    if (
        anyUndefined(
            ctx.request.body,
            ctx.request.body.duration,
            ctx.request.body.reference,
            ctx.request.body.reason,
        )
    ) {
        return ctx.send({type: 'danger', message: 'Missing parameters or invalid identifiers.'});
    }
    let reference = ctx.request.body.reference;
    const inputDuration = ctx.request.body.duration.trim();
    const reason = ctx.request.body.reason.trim();

    //Converting ID to int
    if (typeof reference === 'string') {
        const intID = parseInt(reference);
        if (isNaN(intID)) {
            return ctx.send({type: 'danger', message: 'You must send at least one identifier.'});
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
        const [ multiplierInput, unit ] = inputDuration.split(/\s+/);
        const multiplier = parseInt(multiplierInput);
        if (isNaN(multiplier) || multiplier < 1) {
            return ctx.send({type: 'danger', message: 'The duration multiplier must be a number above 1.'});
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
            return ctx.send({type: 'danger', message: 'Invalid ban duration. Supported units: hours, days, weeks, months'});
        }
        expiration = now() + duration;
    }

    //Check permissions
    if (!ensurePermission(ctx, 'players.ban')) return false;

    //Register action (and checks if player is online)
    let actionId;
    try {
        actionId = await globals.playerController.registerAction(reference, 'ban', sess.auth.username, reason, expiration);
    } catch (error) {
        return ctx.send({type: 'danger', message: `<b>Error:</b> ${error.message}`});
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

    let cmd;
    if (Array.isArray(reference)) {
        cmd = formatCommand('txaDropIdentifiers', reference.join(';'), msg);
        ctx.utils.logAction(`Banned <${reference.join(';')}>: ${reason}`);
    } else if (Number.isInteger(reference)) {
        cmd = formatCommand('txaKickID', reference, msg);
        ctx.utils.logAction(`Banned #${reference}: ${reason}`);
    } else {
        return ctx.send({type: 'danger', message: '<b>Error:</b> unknown reference type'});
    }

    // Dispatch `txAdmin:events:playerBanned`
    globals.fxRunner.sendEvent('playerBanned', {
        author: sess.auth.username,
        reason,
        actionId,
        target: reference,
        expiration
    });

    const toResp = await globals.fxRunner.srvCmdBuffer(cmd);
    return sendAlertOutput(ctx, toResp, 'Identifiers banned!<br>Kicking players:');
}


//================================================================
/**
 * Handle Whitelist Action
 * @param {object} ctx
 * @param {object} sess
 */
async function handleWhitelist(ctx, sess) {
    //Checking request
    if (anyUndefined(ctx.request.body.reference)) {
        return ctx.send({type: 'danger', message: 'Invalid request.'});
    }
    const reference = ctx.request.body.reference.trim();

    //Check permissions
    if (!ensurePermission(ctx, 'players.whitelist')) return false;

    //Whitelist reference
    let actionId;
    try {
        actionId = await globals.playerController.approveWhitelist(reference, sess.auth.username);
    } catch (error) {
        return ctx.send({type: 'danger', message: `<b>Error:</b> ${error.message}`});
    }

    // Dispatch `txAdmin:events:playerWhitelisted`
    globals.fxRunner.sendEvent('playerWhitelisted', {
        target: reference,
        author: sess.auth.username,
        actionId,
    });

    ctx.utils.logAction(`Whitelisted ${reference}`);
    return ctx.send({refresh: true});
}


//================================================================
/**
 * Handle Revoke Action
 * @param {object} ctx
 * @param {object} sess
 */
async function handleRevokeAction(ctx, sess) {
    //Checking request
    if (anyUndefined(ctx.request.body.action_id)) {
        return ctx.send({type: 'danger', message: 'Invalid request.'});
    }
    const action_id = ctx.request.body.action_id.trim();

    //Check permissions
    const perms = [];
    if (ensurePermission(ctx, 'players.ban')) perms.push('ban');
    if (ensurePermission(ctx, 'players.warn')) perms.push('warn');
    if (ensurePermission(ctx, 'players.whitelist')) perms.push('whitelist');

    //Revoke action
    try {
        const errorMsg = await globals.playerController.revokeAction(action_id, sess.auth.username, perms);
        if (errorMsg !== null) {
            return ctx.send({type: 'danger', message: `<b>Error:</b> ${errorMsg}`});
        }
    } catch (error) {
        return ctx.send({type: 'danger', message: `<b>Error:</b> ${error.message}`});
    }
    ctx.utils.logAction(`Revoked ${action_id}`);
    return ctx.send({refresh: true});
}
