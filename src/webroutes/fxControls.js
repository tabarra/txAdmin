//Requires
const sleep = require('util').promisify(setTimeout);
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const webUtils = require('./webUtils.js');
const context = 'WebServer:fxControls';


/**
 * Handle all the server control actions
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    //Sanity check
    if(typeof req.params.action === 'undefined'){
        res.status(400);
        res.send({status: 'error', error: "Invalid Request"});
        return;
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
        globals.discordBot.sendAnnouncement(`Restarting server **${globals.config.serverName}**.`);
        await globals.fxRunner.srvCmd(`txaKickAll "server restarting"`);
        await sleep(1000);
        await globals.fxRunner.restartServer('via txAdmin Web Panel');
        return res.send({type: 'warning', message: 'Restarting server...'});

    }else if(action == 'stop'){
        webUtils.appendLog(req, `STOP SERVER`, context);
        globals.discordBot.sendAnnouncement(`Stopping server **${globals.config.serverName}**.`);
        await globals.fxRunner.srvCmd(`txaKickAll "server shutting down"`);
        await sleep(1000);
        globals.fxRunner.killServer();
        return res.send({type: 'warning', message: 'Server stopped.'});

    }else if(action == 'start'){
        webUtils.appendLog(req, `START SERVER`, context);
        globals.discordBot.sendAnnouncement(`Starting server **${globals.config.serverName}**.`);
        globals.fxRunner.spawnServer();
        return res.send({type: 'warning', message: 'Starting server...'});

    }else{
        logWarn(`Unknown control action '${action}'.`, context);
        res.status(400);
        return res.send({type: 'danger', message: 'Unknown Action'});
    }
};
