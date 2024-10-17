const modulename = 'WebServer:FXServerControls';
import { AuthedCtx } from '@core/components/WebServer/ctxTypes';
import consoleFactory from '@extras/console';
import { ApiToastResp } from '@shared/genericApiTypes';
const console = consoleFactory(modulename);


/**
 * Handle all the server control actions
 */
export default async function FXServerControls(ctx: AuthedCtx) {
    //Sanity check
    if (typeof ctx.request.body?.action !== 'string') {
        return ctx.utils.error(400, 'Invalid Request');
    }
    const { action } = ctx.request.body;
    const fxRunner = ctx.txAdmin.fxRunner;

    //Check permissions
    if (!ctx.admin.testPermission('control.server', modulename)) {
        return ctx.send<ApiToastResp>({
            type: 'error',
            msg: 'You don\'t have permission to execute this action.',
        });
    }

    if (action == 'restart') {
        ctx.admin.logCommand('RESTART SERVER');
        //TODO: delay override message logic should be on fxserver, but for now keep here
        // as it messages with the sync notification on the UI
        if (fxRunner.restartDelayOverride && fxRunner.restartDelayOverride <= 4000) {
            fxRunner.restartServer('admin request', ctx.admin.name); 
            return ctx.send<ApiToastResp>({
                type: 'success',
                msg: `The server is now restarting with delay override ${fxRunner.restartDelayOverride}.`
            });
        } else {
            const restartError = await fxRunner.restartServer('admin request', ctx.admin.name);
            if (restartError !== null) {
                return ctx.send<ApiToastResp>({ type: 'error', md: true, msg: restartError });
            } else {
                return ctx.send<ApiToastResp>({ type: 'success', msg: 'The server is now restarting.' });
            }
        }

    } else if (action == 'stop') {
        if (fxRunner.fxChild === null) {
            return ctx.send<ApiToastResp>({ type: 'success', msg: 'The server is already stopped.' });
        }
        ctx.admin.logCommand('STOP SERVER');
        await fxRunner.killServer('admin request', ctx.admin.name, false);
        return ctx.send<ApiToastResp>({ type: 'success', msg: 'Server stopped.' });

    } else if (action == 'start') {
        if (fxRunner.fxChild !== null) {
            return ctx.send<ApiToastResp>({
                type: 'error',
                msg: 'The server is already running. If it\'s not working, press RESTART.'
            });
        }
        ctx.admin.logCommand('START SERVER');
        const spawnError = await fxRunner.spawnServer(true);
        if (spawnError !== null) {
            return ctx.send<ApiToastResp>({ type: 'error', md: true, msg: spawnError });
        } else {
            return ctx.send<ApiToastResp>({ type: 'success', msg: 'The server is now starting.' });
        }

    } else {
        return ctx.send<ApiToastResp>({
            type: 'error',
            msg: `Unknown control action '${action}'.`,
        });
    }
};
