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
        let restartMsg = await globals.fxRunner.restartServer(req.session.auth.username);
        if(restartMsg !== null){
            return res.send({type: 'danger', message: restartMsg});
        }else{
            return res.send({type: 'success', message: 'Restarting server...'});
        }

    }else if(action == 'stop'){
        if(globals.fxRunner.fxChild === null){
            return res.send({type: 'danger', message: 'The server is already stopped.'});
        }
        webUtils.appendLog(req, `STOP SERVER`, context);
        await globals.fxRunner.killServer(req.session.auth.username);
        return res.send({type: 'warning', message: 'Server stopped.'});

    }else if(action == 'start'){
        if(globals.fxRunner.fxChild !== null){
            return res.send({type: 'danger', message: 'The server is already running. If it\'s not working, press RESTART.'});
        }
        webUtils.appendLog(req, `START SERVER`, context);
        let spawnMsg = await globals.fxRunner.spawnServer(true);
        if(spawnMsg !== null){
            return res.send({type: 'danger', message: spawnMsg});
        }else{
            return res.send({type: 'success', message: 'Starting server...'});
        }

    }else{
        logWarn(`Unknown control action '${action}'.`, context);
        return res.status(400).send({type: 'danger', message: 'Unknown Action'});
    }
};
