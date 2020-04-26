//Requires
const modulename = 'WebServer:FXServerControls';
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);


/**
 * Handle all the server control actions
 * @param {object} ctx
 */
module.exports = async function FXServerControls(ctx) {
    //Sanity check
    if(typeof ctx.params.action === 'undefined'){
        return ctx.utils.error(400, 'Invalid Request');
    }
    let action = ctx.params.action;

    //Check permissions
    if(!ctx.utils.checkPermission('control.server', modulename)){
        return ctx.send({
            type: 'danger',
            message: `You don't have permission to execute this action.`
        });
    }

    if(action == 'restart'){
        ctx.utils.appendLog(`RESTART SERVER`);
        if(globals.fxRunner.restartDelayOverride || globals.fxRunner.restartDelayOverride <= 4000){
            globals.fxRunner.restartServer(ctx.session.auth.username);
            return ctx.send({type: 'success', message: `Restarting the fxserver with delay override ${globals.fxRunner.restartDelayOverride}.`});
        }else{
            let restartMsg = await globals.fxRunner.restartServer(ctx.session.auth.username);
            if(restartMsg !== null){
                return ctx.send({type: 'danger', message: restartMsg});
            }else{
                return ctx.send({type: 'success', message: 'Restarting server...'});
            }
        }

    }else if(action == 'stop'){
        if(globals.fxRunner.fxChild === null){
            return ctx.send({type: 'danger', message: 'The server is already stopped.'});
        }
        ctx.utils.appendLog(`STOP SERVER`);
        await globals.fxRunner.killServer(ctx.session.auth.username);
        return ctx.send({type: 'warning', message: 'Server stopped.'});

    }else if(action == 'start'){
        if(globals.fxRunner.fxChild !== null){
            return ctx.send({type: 'danger', message: 'The server is already running. If it\'s not working, press RESTART.'});
        }
        ctx.utils.appendLog(`START SERVER`);
        let spawnMsg = await globals.fxRunner.spawnServer(true);
        if(spawnMsg !== null){
            return ctx.send({type: 'danger', message: spawnMsg});
        }else{
            return ctx.send({type: 'success', message: 'Starting server...'});
        }

    }else{
        logWarn(`Unknown control action '${action}'.`);
        return ctx.utils.error(400, 'Unknown Action');
    }
};
