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

    if(action == 'admin_broadcast'){
        let cmd = `txaBroadcast "${escape(parameter)}"`;
        webUtils.appendLog(req, cmd, context);
        let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
        return sendAlertOutput(res, toResp);

    }else if(action == 'admin_dm'){
        if(!Array.isArray(parameter) || parameter.length !== 2){
            return sendAlertOutput(res, 'Invalid request');
        }
        let cmd = `txaSendDM ${parameter[0]} "${escape(parameter[1])}"`;
        webUtils.appendLog(req, cmd, context);
        let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
        return sendAlertOutput(res, toResp);

    }else if(action == 'kick_player'){
        let cmd = `txaKickID ${parameter}`;
        webUtils.appendLog(req, cmd, context);
        let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
        return sendAlertOutput(res, toResp);

    }else if(action == 'kick_all'){
        let cmd = `txaKickAll "kicked via txAdmin web panel"`;
        webUtils.appendLog(req, cmd, context);
        let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
        return sendAlertOutput(res, toResp);

    }else if(action == 'restart_res'){
        let cmd = `restart ${parameter}`;
        webUtils.appendLog(req, cmd, context);
        let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
        return sendAlertOutput(res, toResp);

    }else if(action == 'start_res'){
        let cmd = `start ${parameter}`;
        webUtils.appendLog(req, cmd, context);
        let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
        return sendAlertOutput(res, toResp);

    }else if(action == 'ensure_res'){
        let cmd = `ensure ${parameter}`;
        webUtils.appendLog(req, cmd, context);
        let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
        return sendAlertOutput(res, toResp);

    }else if(action == 'stop_res'){
        let cmd = `stop ${parameter}`;
        webUtils.appendLog(req, cmd, context);
        let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
        return sendAlertOutput(res, toResp);

    }else if(action == 'refresh_res'){
        let cmd = `refresh`;
        webUtils.appendLog(req, cmd, context);
        let toResp = await globals.fxRunner.srvCmdBuffer(cmd);
        return sendAlertOutput(res, toResp);

    }else{
        webUtils.appendLog(req, 'Unknown action!', context);
        return sendAlertOutput(res, 'Unknown action!');

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
    return res.send(`<b>Output:<br> <pre>${toResp}</pre>`);
}


//================================================================
/**
 * Wrapper function to render the generic view with the output
 * NOTE: not used
 * @param {object} res
 * @param {string} msg
 */
async function sendPageOutput(res, msg){
    let data = {
        headerTitle: 'Output',
        message: `<pre>${xss(msg)}</pre>`
    }
    let out = await webUtils.renderMasterView('generic', data);
    return res.send(out);
}
