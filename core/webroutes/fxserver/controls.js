const modulename = 'WebServer:FXServerControls';
import logger from '@core/extras/console.js';
const { dir, log, logOk, logWarn, logError } = logger(modulename);


/**
 * Handle all the server control actions
 * @param {object} ctx
 */
export default async function FXServerControls(ctx) {
    //Sanity check
    if (typeof ctx.params.action === 'undefined') {
        return ctx.utils.error(400, 'Invalid Request');
    }
    const action = ctx.params.action;

    //Check permissions
    if (!ctx.utils.checkPermission('control.server', modulename)) {
        return ctx.send({
            type: 'danger',
            message: 'You don\'t have permission to execute this action.',
        });
    }

    if (action == 'restart') {
        ctx.utils.logCommand('RESTART SERVER');
        //TODO: delay override message logic should be on fxserver, but for now keep here
        // as it messages with the sync notification on the UI
        if (globals.fxRunner.restartDelayOverride || globals.fxRunner.restartDelayOverride <= 4000) {
            globals.fxRunner.restartServer(`requested by ${ctx.session.auth.username}`, ctx.session.auth.username);
            return ctx.send({type: 'success', message: `Restarting the fxserver with delay override ${globals.fxRunner.restartDelayOverride}.`});
        } else {
            const restartMsg = await globals.fxRunner.restartServer(`requested by ${ctx.session.auth.username}`, ctx.session.auth.username);
            if (restartMsg !== null) {
                return ctx.send({type: 'danger', markdown: true, message: restartMsg});
            } else {
                return ctx.send({type: 'success', message: 'Restarting server...'});
            }
        }
    } else if (action == 'stop') {
        if (globals.fxRunner.fxChild === null) {
            return ctx.send({type: 'danger', message: 'The server is already stopped.'});
        }
        ctx.utils.logCommand('STOP SERVER');
        await globals.fxRunner.killServer(`requested by ${ctx.session.auth.username}`, ctx.session.auth.username, false);
        return ctx.send({type: 'warning', message: 'Server stopped.'});
    } else if (action == 'start') {
        if (globals.fxRunner.fxChild !== null) {
            return ctx.send({type: 'danger', message: 'The server is already running. If it\'s not working, press RESTART.'});
        }
        ctx.utils.logCommand('START SERVER');
        const spawnMsg = await globals.fxRunner.spawnServer(true);
        if (spawnMsg !== null) {
            return ctx.send({type: 'danger', markdown: true, message: spawnMsg});
        } else {
            return ctx.send({type: 'success', message: 'Starting server...'});
        }
    } else {
        logWarn(`Unknown control action '${action}'.`);
        return ctx.utils.error(400, 'Unknown Action');
    }
};
