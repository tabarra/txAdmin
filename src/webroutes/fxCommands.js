//Requires
const Sqrl = require("squirrelly");
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const webUtils = require('./webUtils.js');
const context = 'WebServer:fxCommands';


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
        res.send('Invalid request!');
        return;
    }
    let action = req.body.action;
    let parameter = req.body.parameter;

    if(action == 'admin_say'){
        webUtils.appendLog(req, `say ${parameter}`, context);
        globals.fxRunner.srvCmd('say ' + parameter);
        return sendOutput(res, 'Okay');

    }else if(action == 'restart_res'){
        webUtils.appendLog(req, `restart ${parameter}`, context);
        let toResp = await globals.fxRunner.srvCmdBuffer('restart ' + parameter);
        return sendOutput(res, toResp);

    }else if(action == 'start_res'){
        webUtils.appendLog(req, `start ${parameter}`, context);
        let toResp = await globals.fxRunner.srvCmdBuffer('start ' + parameter);
        return sendOutput(res, toResp);

    }else if(action == 'stop_res'){
        webUtils.appendLog(req, `stop ${parameter}`, context);
        let toResp = await globals.fxRunner.srvCmdBuffer('stop ' + parameter);
        return sendOutput(res, toResp);

    }else if(action == 'refresh_res'){
        webUtils.appendLog(req, `refresh`, context);
        let toResp = await globals.fxRunner.srvCmdBuffer('refresh');
        return sendOutput(res, toResp);

    }else{
        webUtils.appendLog(req, `unknown action`, context);
        return sendOutput(res, 'Unknown action!');
    }
};



//================================================================
/**
 * Wrapper function to render the generic view and send the output
 * @param {object} res 
 * @param {string} msg 
 */
async function sendOutput(res, msg){
    let out = await webUtils.renderMasterView('generic', {headerTitle: 'Output', message: msg});
    return res.send(out);
}   
