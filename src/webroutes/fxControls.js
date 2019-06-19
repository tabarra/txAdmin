//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const webUtils = require('./webUtils.js');
const context = 'WebServer:fxControls';


/**
 * Handle all the server control actions
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    if(typeof req.params.action === 'undefined'){
        res.status(400);
        res.send({status: 'error', error: "Invalid Request"});
        return;
    }
    let action = req.params.action;

    if(action == 'restart'){
        webUtils.appendLog(req, `RESTART SERVER`, context);
        await globals.fxRunner.restartServer('via txAdmin Web Panel');
        res.send({status: 'ok'});
        return;

    }else if(action == 'stop'){
        webUtils.appendLog(req, `STOP SERVER`, context);
        globals.fxRunner.killServer();
        res.send({status: 'ok'});
        return;

    }else if(action == 'start'){
        webUtils.appendLog(req, `START SERVER`, context);
        globals.fxRunner.spawnServer();
        res.send({status: 'ok'});
        return;

    }else{
        logWarn(`Unknown control action '${action}'.`, context);
        res.status(400);
        res.send({status: 'error', error: "Invalid Request"});
        return;
    }
};
