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
        appendLog(req, `Message: ${parameter}`);
        globals.fxRunner.srvCmd('say ' + parameter);
        return sendOutput(res, 'Message sent.');

    }else if(action == 'restart_res'){
        appendLog(req, `Restart ${parameter}`);
        let toResp = await globals.fxRunner.srvCmdBuffer('restart ' + parameter);
        return sendOutput(res, toResp);

    }else if(action == 'start_res'){
        appendLog(req, `Start ${parameter}`);
        let toResp = await globals.fxRunner.srvCmdBuffer('start ' + parameter);
        return sendOutput(res, toResp);

    }else if(action == 'stop_res'){
        appendLog(req, `Stop ${parameter}`);
        let toResp = await globals.fxRunner.srvCmdBuffer('stop ' + parameter);
        return sendOutput(res, toResp);

    }else if(action == 'refresh_res'){
        appendLog(req, `refresh`);
        let toResp = await globals.fxRunner.srvCmdBuffer('refresh');
        return sendOutput(res, toResp);

    }else if(action == 'restart_sv'){
        appendLog(req, `Server restarted`);
        await globals.fxRunner.restartServer();
        return sendOutput(res, 'Server restarted');

    }else if(action == 'stop_sv'){
        appendLog(req, `Server stopped`);
        globals.fxRunner.killServer();
        return sendOutput(res, 'Server stopped');

    }else if(action == 'start_sv'){
        appendLog(req, `Server started`);
        globals.fxRunner.spawnServer();
        return sendOutput(res, 'Server started', 'Click here to see the server starting output');
    }else{
        appendLog(req, `unknown action`);
        return sendOutput(res, 'Unknown action!');
    }
};


//==============================================================
function sendOutput(res, msg, stMsg = ''){
    let html = Sqrl.renderFile('public/out.html', {
        msg: msg,
        stMsg : stMsg
    });
    return res.send(html);
}

function appendLog(req, data){
    globals.logger.append(`[${req.connection.remoteAddress}][${req.session.admin}] ${data}`);
}