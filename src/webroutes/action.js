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
        typeof req.body.parameter == undefined
    ){
        logWarn('Invalid data!');
        res.send('Invalid data!');
        return;
    }
    let action = req.body.action;
    let parameter = req.body.parameter;

    if(action == 'admin_say'){
        appendLog(req, `say ${parameter}`);
        globals.fxServer.srvCmd('say ' + parameter);
        return sendOutput(res, 'Okay');

    }else if(action == 'restart_res'){
        appendLog(req, `restart ${parameter}`);
        let toResp = await globals.fxServer.srvCmdBuffer('restart ' + parameter);
        return sendOutput(res, toResp);

    }else if(action == 'start_res'){
        appendLog(req, `start ${parameter}`);
        let toResp = await globals.fxServer.srvCmdBuffer('start ' + parameter);
        return sendOutput(res, toResp);

    }else if(action == 'stop_res'){
        appendLog(req, `stop ${parameter}`);
        let toResp = await globals.fxServer.srvCmdBuffer('stop ' + parameter);
        return sendOutput(res, toResp);

    }else if(action == 'refresh_res'){
        appendLog(req, `refresh`);
        let toResp = await globals.fxServer.srvCmdBuffer('refresh');
        return sendOutput(res, toResp);

    }else if(action == 'restart_sv'){
        appendLog(req, `RESTART SERVER`);
        await globals.fxServer.restartServer();
        return sendOutput(res, 'Done');

    }else if(action == 'stop_sv'){
        appendLog(req, `STOP SERVER`);
        globals.fxServer.killServer();
        return sendOutput(res, 'Done');

    }else if(action == 'start_sv'){
        appendLog(req, `START SERVER`);
        globals.fxServer.spawnServer();
        return sendOutput(res, 'Done');

    }else{
        appendLog(req, `unknown action`);
        return sendOutput(res, 'Unknown action!');
    }
};


//==============================================================
function sendOutput(res, msg){
    let html = Sqrl.renderFile('public/out.html', {msg: msg});
    return res.send(html);
}

function appendLog(req, data){
    globals.logger.append(`[${req.connection.remoteAddress}][${req.session.admin}] ${data}`);
}