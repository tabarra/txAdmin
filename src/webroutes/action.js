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
    //If for some reason you are having trouble with your login, uncomment the next line and change the bypass password
    //if(req.body.password==="bypassPassword") adminID = 'bypass';
    if(!adminID){
        logWarn(`Wrong password from: ${req.connection.remoteAddress}`, context);
        sendOutput(res, 'Wrong password!');
        return;
    }


    let action = req.body.action;
    let parameter = req.body.parameter;

    if(action == 'admin_say'){
        appendLog(adminID, `say ${parameter}`);
        globals.fxServer.srvCmd('say ' + parameter);
        return sendOutput(res, 'Okay');

    }else if(action == 'restart_res'){
        appendLog(adminID, `restart ${parameter}`);
        let toResp = await globals.fxServer.srvCmdBuffer('restart ' + parameter);
        return sendOutput(res, toResp);

    }else if(action == 'start_res'){
        appendLog(adminID, `start ${parameter}`);
        let toResp = await globals.fxServer.srvCmdBuffer('start ' + parameter);
        return sendOutput(res, toResp);

    }else if(action == 'stop_res'){
        appendLog(adminID, `stop ${parameter}`);
        let toResp = await globals.fxServer.srvCmdBuffer('stop ' + parameter);
        return sendOutput(res, toResp);

    }else if(action == 'refresh_res'){
        appendLog(adminID, `refresh`);
        let toResp = await globals.fxServer.srvCmdBuffer('refresh');
        return sendOutput(res, toResp);

    }else if(action == 'restart_sv'){
        appendLog(adminID, `RESTART SERVER`);
        await globals.fxServer.restartServer();
        return sendOutput(res, 'Done');

    }else if(action == 'stop_sv'){
        appendLog(adminID, `STOP SERVER`);
        globals.fxServer.killServer();
        return sendOutput(res, 'Done');

    }else if(action == 'start_sv'){
        appendLog(adminID, `START SERVER`);
        globals.fxServer.spawnServer();
        return sendOutput(res, 'Done');

    }else{
        appendLog(adminID, `unknown action`);
        return sendOutput(res, 'Unknown action!');
    }
};


//==============================================================
function sendOutput(res, msg){
    let html = Sqrl.renderFile('public/out.html', {msg: msg});
    return res.send(html);
}

function appendLog(adminID, data){
    globals.logger.append(`[${adminID}] ${data}`);
}