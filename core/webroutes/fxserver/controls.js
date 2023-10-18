const modulename = 'WebServer:FXServerControls';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);


/**
 * Handle all the server control actions
 * @param {object} ctx
 */
export default async function FXServerControls(ctx) {
    //Sanity check
    if (typeof ctx.request.body?.action !== 'string') {
        return ctx.utils.error(400, 'Invalid Request');
    }
    const { action } = ctx.request.body;

    //Check permissions
    if (!ctx.admin.testPermission('control.server', modulename)) {
        return ctx.send({
            type: 'danger',
            message: 'You don\'t have permission to execute this action.',
        });
    }

    if (action == 'restart') {
        ctx.admin.logCommand('RESTART SERVER');
        //TODO: delay override message logic should be on fxserver, but for now keep here
        // as it messages with the sync notification on the UI
        if (globals.fxRunner.restartDelayOverride && globals.fxRunner.restartDelayOverride <= 4000) {
            globals.fxRunner.restartServer(`requested by ${ctx.admin.name}`, ctx.admin.name);
            return ctx.send({ type: 'success', message: `Restarting the fxserver with delay override ${globals.fxRunner.restartDelayOverride}.` });
        } else {
            const restartMsg = await globals.fxRunner.restartServer(`requested by ${ctx.admin.name}`, ctx.admin.name);
            if (restartMsg !== null) {
                return ctx.send({ type: 'danger', markdown: true, message: restartMsg });
            } else {
                return ctx.send({ type: 'success', message: 'Restarting server...' });
            }
        }
    } else if (action == 'stop') {
        if (globals.fxRunner.fxChild === null) {
            return ctx.send({ type: 'success', message: 'The server is already stopped.' });
        }
        ctx.admin.logCommand('STOP SERVER');
        await globals.fxRunner.killServer(`requested by ${ctx.admin.name}`, ctx.admin.name, false);
        return ctx.send({ type: 'success', message: 'Server stopped.' });
    } else if (action == 'start') {
        if (globals.fxRunner.fxChild !== null) {
            return ctx.send({ type: 'danger', message: 'The server is already running. If it\'s not working, press RESTART.' });
        }
        ctx.admin.logCommand('START SERVER');
        const spawnMsg = await globals.fxRunner.spawnServer(true);
        if (spawnMsg !== null) {
            return ctx.send({ type: 'danger', markdown: true, message: spawnMsg });
        } else {
            return ctx.send({ type: 'success', message: 'Starting server...' });
        }
    } else {
        console.warn(`Unknown control action '${action}'.`);
        return ctx.utils.error(400, 'Unknown Action');
    }
};
