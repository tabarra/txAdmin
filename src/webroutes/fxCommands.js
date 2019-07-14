//Requires
const xss = require("xss");
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const webUtils = require('./webUtils.js');
const context = 'WebServer:fxCommands';

const escape = (x) => {return x.replace(/\"/g, '\\"');};


/**
 * Handle all the server commands
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    if(
        typeof req.body.action === 'undefined' ||
        typeof req.body.parameter === 'undefined'
    ){
        dir(req.body)
        logWarn('Invalid request!', context);
        return sendAlertOutput(res, 'Invalid request!');;
    }
    let action = req.body.action;
    let parameter = req.body.parameter;

    //==============================================
    if(action == 'admin_broadcast'){
        if(!ensurePermission('commands.message', res, req)) return false;
        let cmd = `txaBroadcast "${escape(parameter)}"`;
        webUtils.appendLog(req, cmd, context);
        let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
        return sendAlertOutput(res, toResp);

    //==============================================
    }else if(action == 'admin_dm'){
        if(!ensurePermission('commands.message', res, req)) return false;
        if(!Array.isArray(parameter) || parameter.length !== 2){
            return sendAlertOutput(res, 'Invalid request');
        }
        let cmd = `txaSendDM ${parameter[0]} "${escape(parameter[1])}"`;
        webUtils.appendLog(req, cmd, context);
        let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
        return sendAlertOutput(res, toResp);

    //==============================================
    }else if(action == 'kick_player'){
        if(!ensurePermission('commands.kick', res, req)) return false;
        let cmd = `txaKickID ${parameter}`;
        webUtils.appendLog(req, cmd, context);
        let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
        return sendAlertOutput(res, toResp);

    //==============================================
    }else if(action == 'kick_all'){
        if(!ensurePermission('commands.kick', res, req)) return false;
        let cmd = `txaKickAll "kicked via txAdmin web panel"`;
        webUtils.appendLog(req, cmd, context);
        let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
        return sendAlertOutput(res, toResp);

    //==============================================
    }else if(action == 'restart_res'){
        if(!ensurePermission('commands.resources', res, req)) return false;
        let cmd = `restart ${parameter}`;
        webUtils.appendLog(req, cmd, context);
        let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
        return sendAlertOutput(res, toResp);

    //==============================================
    }else if(action == 'start_res'){
        if(!ensurePermission('commands.resources', res, req)) return false;
        let cmd = `start ${parameter}`;
        webUtils.appendLog(req, cmd, context);
        let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
        return sendAlertOutput(res, toResp);

    //==============================================
    }else if(action == 'ensure_res'){
        if(!ensurePermission('commands.resources', res, req)) return false;
        let cmd = `ensure ${parameter}`;
        webUtils.appendLog(req, cmd, context);
        let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
        return sendAlertOutput(res, toResp);

    //==============================================
    }else if(action == 'stop_res'){
        if(!ensurePermission('commands.resources', res, req)) return false;
        let cmd = `stop ${parameter}`;
        webUtils.appendLog(req, cmd, context);
        let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
        return sendAlertOutput(res, toResp);

    //==============================================
    }else if(action == 'refresh_res'){
        if(!ensurePermission('commands.resources', res, req)) return false;
        let cmd = `refresh`;
        webUtils.appendLog(req, cmd, context);
        let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
        return sendAlertOutput(res, toResp);

    //==============================================
    }else if(action == 'reinject_res'){
        if(!ensurePermission('commands.resources', res, req)) return false;
        await globals.fxRunner.injectResources();
        let toResp = await globals.fxRunner.srvCmdBuffer('refresh');
        setTimeout(async () => {
            globals.fxRunner.setFXServerEnv();
        }, 1500);
        webUtils.appendLog(req, 'Re-Injected txAdmin resources', context);
        return sendAlertOutput(res, toResp);

    //==============================================
    }else{
        webUtils.appendLog(req, 'Unknown action!', context);
        return res.send({
            type: 'danger',
            message: `Unknown Action.`
        });
    }
};



//================================================================
/**
 * Wrapper function to render send the output to be shown inside an alert
 * @param {object} res
 * @param {string} msg
 */
async function sendAlertOutput(res, toResp){
    toResp = (toResp.length)? xss(toResp) : 'no output';
    return res.send({
        type: 'warning',
        message: `<b>Output:<br> <pre>${toResp}</pre>`
    });
}


//================================================================
/**
 * Wrapper function to check permission and give output if denied
 * @param {string} perm
 * @param {object} res
 * @param {object} req
 */
function ensurePermission(perm, res, req){
    if(webUtils.checkPermission(req, perm, context)){
        return true;
    }else{
        res.send({
            type: 'danger',
            message: `You don't have permission to execute this action.`
        });
        return false;
    }
}
