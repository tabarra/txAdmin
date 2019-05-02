//Requires
const Sqrl = require("squirrelly");
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'WebServer:action';


/**
 * Handle all the server actions
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    if(
        typeof req.body.action == undefined ||
        typeof req.body.parameter == undefined ||
        typeof req.body.password == undefined
    ){
        logWarn('Invalid data!');
        res.send('Invalid data!');
        return;
    }
    let adminID = globals.authenticator.checkAuth(req.body.password);
    if(!adminID){
        logWarn(`Wrong password from: ${req.connection.remoteAddress}`, context);
        sendOutput(res, 'Wrong password!');
        return;
    }


    let action = req.body.action;
    let parameter = req.body.parameter;
    log(`[${adminID} - ${req.connection.remoteAddress}] Command: '${action} ${parameter}'`, context)

    if(action == 'admin_say'){
        globals.fxServer.srvCmd('say ' + parameter);
        return sendOutput(res, 'Okay');

    }else if(action == 'restart_res'){
        let toResp = await globals.fxServer.srvCmdBuffer('restart ' + parameter);
        return sendOutput(res, toResp);

    }else if(action == 'start_res'){
        let toResp = await globals.fxServer.srvCmdBuffer('start ' + parameter);
        return sendOutput(res, toResp);

    }else if(action == 'stop_res'){
        let toResp = await globals.fxServer.srvCmdBuffer('stop ' + parameter);
        return sendOutput(res, toResp);

    }else if(action == 'refresh_res'){
        let toResp = await globals.fxServer.srvCmdBuffer('refresh');
        return sendOutput(res, toResp);

    }else if(action == 'restart_sv'){
        await globals.fxServer.restartServer();
        return sendOutput(res, 'Done');

    }else if(action == 'stop_sv'){
        globals.fxServer.killServer();
        return sendOutput(res, 'Done');

    }else if(action == 'start_sv'){
        globals.fxServer.spawnServer();
        return sendOutput(res, 'Done');

    }else{
        return sendOutput(res, 'Unknown action!');
    }
};


//==============================================================
function sendOutput(res, msg){
    let html = Sqrl.renderFile('public/out.html', {msg: msg});
    return res.send(html);
}