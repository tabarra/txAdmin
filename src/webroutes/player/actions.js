//Requires
const modulename = 'WebServer:PlayerActions';
const xss = require('../../extras/xss')();
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Helper functions 
const anyUndefined = (...args) => { return [...args].some(x => (typeof x === 'undefined')) };
const escape = (x) => {return x.replace(/\"/g, '\uff02');};
const formatCommand = (cmd, ...params) => {
    return `${cmd} "` + [...params].map(escape).join(`" "`) + `"`;
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
        return await handleXXXXX(ctx);
    }else if(action === 'revoke_action'){
        return await handleXXXXX(ctx);
    }else if(action === 'search'){
        return await handleXXXXX(ctx);
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
 * 
 * TODO: register the warning on the database
 * TODO: use translation
 * 
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
    let id = ctx.request.body.id;
    let reason = ctx.request.body.reason.trim();

    //Check permissions
    if(!ensurePermission(ctx, 'commands.warn')) return false;

    let translations = JSON.stringify({
        title: 'WARNING',
        warned_by: 'Warned by:',
        instruction: 'Hold [SPACE] for 10 seconds to dismiss this message.'
    })

    //Prepare and send command
    let cmd = formatCommand('txaWarnID', id, ctx.session.auth.username, reason, translations);
    ctx.utils.appendLog(cmd);
    let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
    return sendAlertOutput(ctx, toResp);
}


//================================================================
/**
 * Handle XXXXX
 * @param {object} ctx
 */
async function handleXXXXX(ctx) {
    //Checking request
    if(anyUndefined(ctx.request.body.yyyyy)){
        return ctx.send({type: 'danger', message: 'Invalid request.'});
    }
    let yyyyy = ctx.request.body.yyyyy.trim();

    //Check permissions
    if(!ctx.utils.checkPermission('all_permissions', modulename)){
        return ctx.send({
            type: 'danger',
            message: `You don't have permission to execute this action.`
        });
    }

    //TODO: actually code things
}

