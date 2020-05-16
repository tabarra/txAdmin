//Requires
const modulename = 'WebServer:FXServerCommands';
const xss = require('../../extras/xss')();
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Helper functions
const escape = (x) => {return x.replace(/\"/g, '\uff02');};
const formatCommand = (cmd, ...params) => {
    return `${cmd} "` + [...params].map(escape).join(`" "`) + `"`;
};


/**
 * Handle all the server commands
 * @param {object} ctx
 */
module.exports = async function FXServerCommands(ctx) {
    if(
        typeof ctx.request.body.action === 'undefined' ||
        typeof ctx.request.body.parameter === 'undefined'
    ){
        logWarn('Invalid request!');
        return sendAlertOutput(ctx, 'Invalid request!');
    }
    let action = ctx.request.body.action;
    let parameter = ctx.request.body.parameter;

    //Ignore commands when the server is offline
    if(globals.fxRunner.fxChild === null){
        return ctx.send({
            type: 'danger',
            message: `<b>Cannot execute this action with the server offline.</b>`
        });
    }

    //Block starting/restarting the 'runcode' resource
    let unsafeActions = ['restart_res', 'start_res', 'ensure_res'];
    if(unsafeActions.includes(action) && parameter.includes('runcode')){
        return ctx.send({
            type: 'danger',
            message: `<b>Error:</b> The resource "runcode" might be unsafe. <br> If you know what you are doing, run it via the Live Console.`
        });
    }


    //==============================================
    //DEBUG: Only available in the /advanced page
    if(action == 'profile_monitor'){
        if(!ensurePermission(ctx, 'all_permissions')) return false;
        ctx.utils.appendLog('Profiling txAdmin instance.');
        
        let profSeconds = 5;
        let savePath = `${globals.info.serverProfilePath}/data/txProfile.bin`;
        ExecuteCommand("profiler record start");
        setTimeout(async ()=>{
            ExecuteCommand("profiler record stop");
            setTimeout(async ()=>{
                ExecuteCommand(`profiler save "${escape(savePath)}"`);
                setTimeout(async ()=>{
                    logOk(`Profile saved to: ${savePath}`);
                    let cmd = `profiler view "${escape(savePath)}"`;
                    globals.fxRunner.srvCmdBuffer(cmd);
                }, 150)
            }, 150)
        }, profSeconds * 1000);
        return sendAlertOutput(ctx, 'Check your live console in a few seconds.');

    //==============================================
    }else if(action == 'admin_broadcast'){
        if(!ensurePermission(ctx, 'commands.message')) return false;
        let cmd = formatCommand('txaBroadcast', ctx.session.auth.username, parameter);
        ctx.utils.appendLog(cmd);
        let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
        return sendAlertOutput(ctx, toResp);

    //==============================================
    }else if(action == 'kick_all'){
        if(!ensurePermission(ctx, 'commands.kick')) return false;
        let cmd;
        if(parameter.length){
            cmd = formatCommand('txaKickAll', parameter);
        }else{
            cmd = `txaKickAll "txAdmin Web Panel"`;
        }
        ctx.utils.appendLog(cmd);
        let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
        return sendAlertOutput(ctx, toResp);

    //==============================================
    }else if(action == 'restart_res'){
        if(!ensurePermission(ctx, 'commands.resources')) return false;
        let cmd = formatCommand('restart', parameter);
        ctx.utils.appendLog(cmd);
        let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
        return sendAlertOutput(ctx, toResp);

    //==============================================
    }else if(action == 'start_res'){
        if(!ensurePermission(ctx, 'commands.resources')) return false;
        let cmd = formatCommand('start', parameter);
        ctx.utils.appendLog(cmd);
        let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
        return sendAlertOutput(ctx, toResp);

    //==============================================
    }else if(action == 'ensure_res'){
        if(!ensurePermission(ctx, 'commands.resources')) return false;
        let cmd = formatCommand('ensure', parameter);
        ctx.utils.appendLog(cmd);
        let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
        return sendAlertOutput(ctx, toResp);

    //==============================================
    }else if(action == 'stop_res'){
        if(!ensurePermission(ctx, 'commands.resources')) return false;
        let cmd = formatCommand('stop', parameter);
        ctx.utils.appendLog(cmd);
        let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
        return sendAlertOutput(ctx, toResp);

    //==============================================
    }else if(action == 'refresh_res'){
        if(!ensurePermission(ctx, 'commands.resources')) return false;
        let cmd = `refresh`;
        ctx.utils.appendLog(cmd);
        let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
        return sendAlertOutput(ctx, toResp);

    //==============================================
    }else if(action == 'check_txaclient'){
        let cmd = `txaPing`;
        ctx.utils.appendLog(cmd);
        let toResp = await globals.fxRunner.srvCmdBuffer(cmd, 512);
        if(toResp.includes('Pong!')){
            return ctx.send({
                type: 'success',
                message: `<b>txAdminClient is running!<br> <pre>${xss(toResp)}</pre>`
            });
        }else{
            return ctx.send({
                type: 'danger',
                message: `<b>txAdminClient is not running!<br> <pre>${xss(toResp)}</pre>`
            });
        }

    //==============================================
    }else{
        ctx.utils.appendLog('Unknown action!');
        return ctx.send({
            type: 'danger',
            message: `Unknown Action.`
        });
    }
};



//================================================================
/**
 * Wrapper function to send the output to be shown inside an alert
 * @param {object} ctx
 * @param {string} msg
 */
async function sendAlertOutput(ctx, toResp){
    toResp = (toResp.length)? xss(toResp) : 'no output';
    return ctx.send({
        type: 'warning',
        message: `<b>Output:<br> <pre>${toResp}</pre>`
    });
}


//================================================================
/**
 * Wrapper function to check permission and give output if denied
 * @param {object} ctx
 * @param {string} perm
 */
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
