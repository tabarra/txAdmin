//Requires
const sleep = require('util').promisify(setTimeout);
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../extras/console');
const webUtils = require('./../webUtils.js');
const context = 'WebServer:FXServer-Controls';


/**
 * Handle all the server control actions
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    //Sanity check
    if(typeof req.params.action === 'undefined'){
        return res.status(400).send({status: 'error', error: "Invalid Request"});
    }
    let action = req.params.action;

    //Check permissions
    if(!webUtils.checkPermission(req, 'control.server', context)){
        return res.send({
            type: 'danger',
            message: `You don't have permission to execute this action.`
        });
    }

    if(action == 'restart'){
        webUtils.appendLog(req, `RESTART SERVER`, context);
        await globals.fxRunner.restartServer('admin');
        return res.send({type: 'warning', message: 'Restarting server...'});

    }else if(action == 'stop'){
        if(globals.fxRunner.fxChild === null){
            return res.send({type: 'danger', message: 'The server is already stopped.'});
        }
        webUtils.appendLog(req, `STOP SERVER`, context);
        await globals.fxRunner.killServer('admin');
        return res.send({type: 'warning', message: 'Server stopped.'});

    }else if(action == 'start'){
        if(globals.fxRunner.fxChild !== null){
            return res.send({type: 'danger', message: 'The server is already running. If it\'s not working, press RESTART.'});
        }
        webUtils.appendLog(req, `START SERVER`, context);
        globals.fxRunner.spawnServer(true);
        return res.send({type: 'warning', message: 'Starting server...'});

    }else{
        logWarn(`Unknown control action '${action}'.`, context);
        return res.status(400).send({type: 'danger', message: 'Unknown Action'});
    }
};
