//Requires
const modulename = 'WebServer:PlayerActions';
const xss = require('../../extras/xss')();
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Helper functions 
const now = () => { return Math.round(Date.now() / 1000) };
const anyUndefined = (...args) => { return [...args].some(x => (typeof x === 'undefined')) };
const escape = (x) => {return x.replace(/\"/g, '\uff02');};
const formatCommand = (cmd, ...params) => {
    return `${cmd} "` + [...params].map(c => c.toString()).map(escape).join(`" "`) + `"`;
};
function ensurePermission(ctx, perm){
    if(ctx.utils.checkPermission(perm, modulename)){
        return true;
    }else{
        ctx.send({
            type: 'danger',
            message: `You don't have permission to execute this action.`
        });
        return false;
    }
}
function sendAlertOutput(ctx, toResp){
    toResp = (toResp.length)? xss(toResp) : 'no output';
    return ctx.send({
        type: 'warning',
        message: `<b>Output:<br> <pre>${toResp}</pre>`
    });
}


/**
 * Returns the output page containing the bans experiment
 * @param {object} ctx
 */
module.exports = async function PlayerActions(ctx) {
    //Sanity check
    if(anyUndefined(ctx.params.action)){
        return ctx.utils.error(400, 'Invalid Request');
    }
    let action = ctx.params.action;

    //Delegate to the specific action handler
    if(action === 'save_note'){
        return await handleSaveNote(ctx);
    }else if(action === 'message'){
        return await handleMessage(ctx);
    }else if(action === 'kick'){
        return await handleKick(ctx);
    }else if(action === 'warn'){
        return await handleWarning(ctx);
    }else if(action === 'ban'){
        return await handleBan(ctx);
    }else if(action === 'revoke_action'){
        return await handleRevokeAction(ctx);
    }else{
        return ctx.send({
            type: 'danger',
            message: 'Unknown action.'
        });
    }
};


//================================================================
/**
 * Handle Save Note
 * 
 * NOTE: open to all admins
 * 
 * @param {object} ctx
 */
async function handleSaveNote(ctx) {
    //Checking request
    if(anyUndefined(
        ctx.request.body,
        ctx.request.body.note,
        ctx.request.body.license
    )){
        return ctx.send({type: 'danger', message: 'Invalid request.'});
    }
    let license = ctx.request.body.license.trim();
    let note = ctx.request.body.note.trim();

    try {
        let success = await globals.playerController.setPlayerNote(license, note, ctx.session.auth.username);
        if(success){
            return ctx.send({
                type: 'success',
                message: `Saved!`
            });
        }else{
            return ctx.send({
                type: 'danger',
                message: `failed to save note.`
            });
        }
    } catch (error) {
        return ctx.send({
            type: 'danger',
            message: `Failed to save with error: ${error.message}`
        });
    }
}


//================================================================
/**
 * Handle Send Message (admin dm)
 * @param {object} ctx
 */
async function handleMessage(ctx) {
    //Checking request
    if(anyUndefined(
        ctx.request.body,
        ctx.request.body.id,
        ctx.request.body.message
    )){
        return ctx.send({type: 'danger', message: 'Invalid request.'});
    }
    let id = ctx.request.body.id;
    let message = ctx.request.body.message.trim();

    //Check permissions
    if(!ensurePermission(ctx, 'commands.message')) return false;

    //Prepare and send command
    let cmd = formatCommand('txaSendDM', id, ctx.session.auth.username, message);
    ctx.utils.appendLog(cmd);
    let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
    return sendAlertOutput(ctx, toResp);
}


//================================================================
/**
 * Handle Kick Player
 * @param {object} ctx
 */
async function handleKick(ctx) {
    //Checking request
    if(anyUndefined(
        ctx.request.body,
        ctx.request.body.id,
        ctx.request.body.reason
    )){
        return ctx.send({type: 'danger', message: 'Invalid request.'});
    }
    let id = ctx.request.body.id;
    let reason = ctx.request.body.reason.trim();

    //Check permissions
    if(!ensurePermission(ctx, 'commands.kick')) return false;

    //Prepare and send command
    let cmd;
    if(reason.length){
        cmd = formatCommand('txaKickID', id, reason);
    }else{
        cmd = formatCommand('txaKickID', id);
    }
    ctx.utils.appendLog(cmd);
    let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
    return sendAlertOutput(ctx, toResp);
}


//================================================================
/**
 * Handle Send Warning
 * @param {object} ctx
 */
async function handleWarning(ctx) {
    //Checking request
    if(anyUndefined(
        ctx.request.body,
        ctx.request.body.id,
        ctx.request.body.reason
    )){
        return ctx.send({type: 'danger', message: 'Invalid request.'});
    }
    let id = parseInt(ctx.request.body.id);
    let reason = ctx.request.body.reason.trim();

    //Check permissions
    if(!ensurePermission(ctx, 'commands.warn')) return false;

    //Register action (and checks if player is online)
    try {
        await globals.playerController.registerAction(id, 'warn', ctx.session.auth.username, reason, false);
    } catch (error) {
        return ctx.send({type: 'danger', message: `<b>Error:</b> ${error.message}`});
    }

    //Prepare and send command
    let cmd = formatCommand(
        'txaWarnID', 
        id, 
        ctx.session.auth.username, 
        reason, 
        globals.translator.t('nui_warning.title'),
        globals.translator.t('nui_warning.warned_by'),
        globals.translator.t('nui_warning.instruction'),
    );
    ctx.utils.appendLog(cmd);
    let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
    return sendAlertOutput(ctx, toResp);
}


//================================================================
/**
 * Handle Banning command
 * @param {object} ctx
 */
async function handleBan(ctx) {
    //Checking request & identifiers
    if(anyUndefined(
            ctx.request.body,
            ctx.request.body.duration,
            ctx.request.body.reason
        ) ||
        !Array.isArray(ctx.request.body.identifiers) || 
        !ctx.request.body.identifiers.length
    ){
        return ctx.send({type: 'danger', message: 'Missing parameters or invalid identifiers.'});
    }
    let identifiers = ctx.request.body.identifiers;
    let duration = ctx.request.body.duration;
    let reason = ctx.request.body.reason.trim();

    //Calculating expiration
    let expiration;
    const times = {
        t2h: {label: '2 hours', time: 7200}, 
        t8h: {label: '8 hours', time: 28800}, 
        t1d: {label: '1 day', time: 86400}, 
        t2d: {label: '2 days', time: 172800}, 
        t1w: {label: '1 week', time: 604800}, 
        t2w: {label: '2 weeks', time: 1209600}, 
    }
    if(duration == 'perma'){
        expiration = false;
    }else if(times[duration]){
        expiration = now() + times[duration].time;
    }else{
        return ctx.send({type: 'danger', message: 'Unknown ban duration.'}); 
    }

    //Check permissions
    if(!ensurePermission(ctx, 'commands.ban')) return false;

    //Register action (and checks if player is online)
    try {
        let actionID = await globals.playerController.registerAction(identifiers, 'ban', ctx.session.auth.username, reason, expiration);
    } catch (error) {
        return ctx.send({type: 'danger', message: `<b>Error:</b> ${error.message}`});
    }

    //Prepare and send command
    let msg;
    if(expiration !== false){
        msg = `You have been banned for "${times[duration].label}" with reason: ${reason} (${ctx.session.auth.username})`;
    }else{
        msg = `You have been permanently banned for: ${reason} (${ctx.session.auth.username})`;
    }
    let cmd = formatCommand('txaDropIdentifiers', identifiers.join(';'), msg);
    ctx.utils.appendLog(cmd);
    let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
    return sendAlertOutput(ctx, toResp);
}


//================================================================
/**
 * Handle Revoke Action
 * @param {object} ctx
 */
async function handleRevokeAction(ctx) {
    //Checking request
    if(anyUndefined(ctx.request.body.action_id)){
        return ctx.send({type: 'danger', message: 'Invalid request.'});
    }
    let action_id = ctx.request.body.action_id.trim();

    //Check permissions
    if(!ensurePermission(ctx, 'commands.ban')) return false;

    //TODO: actually code things
    return ctx.send({type: 'info', message: 'not existant yet.'});
}

