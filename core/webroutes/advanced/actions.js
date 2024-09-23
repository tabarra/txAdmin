const modulename = 'WebServer:AdvancedActions';
import v8 from 'node:v8';
import bytes from 'bytes';
import got from '@core/extras/got.js';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);

//Helper functions
const isUndefined = (x) => (x === undefined);


/**
 *
 * @param {object} ctx
 */
export default async function AdvancedActions(ctx) {
    //Sanity check
    if (
        isUndefined(ctx.request.body.action)
        || isUndefined(ctx.request.body.parameter)
    ) {
        console.warn('Invalid request!');
        return ctx.send({ type: 'danger', message: '<strong>Invalid request :(</strong>' });
    }
    const action = ctx.request.body.action;
    const parameter = ctx.request.body.parameter;


    //Check permissions
    if (!ctx.admin.testPermission('all_permissions', modulename)) {
        return ctx.send({
            type: 'danger',
            message: 'You don\'t have permission to execute this action.',
        });
    }

    //Action: Change Verbosity
    if (action == 'change_verbosity') {
        console.setVerbose(parameter == 'true');
        globals.fxRunner.resetConvars();
        return ctx.send({ refresh: true });
    } else if (action == 'perform_magic') {
        const message = JSON.stringify(globals.playerlistManager.getPlayerList(), null, 2);
        return ctx.send({ type: 'success', message });
    } else if (action == 'show_db') {
        const dbo = globals.playerDatabase.getDb();
        console.dir(dbo);
        return ctx.send({ type: 'success', message: JSON.stringify(dbo, null, 2) });
    } else if (action == 'show_log') {
        return ctx.send({ type: 'success', message: JSON.stringify(globals.logger.server.getRecentBuffer(), null, 2) });
    } else if (action == 'memory') {
        let memory;
        try {
            const usage = process.memoryUsage();
            Object.keys(usage).forEach((prop) => {
                usage[prop] = bytes(usage[prop]);
            });
            memory = JSON.stringify(usage, null, 2);
        } catch (error) {
            memory = 'error';
        }
        return ctx.send({ type: 'success', message: memory });
    } else if (action == 'freeze') {
        console.warn('Freezing process for 50 seconds.');
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50 * 1000);
    } else if (action == 'resetConvars') {
        globals.fxRunner.resetConvars();
        return ctx.send({ refresh: true });
    } else if (action == 'reauth') {
        // txaEvent "adminsUpdated" "[1,5,7]"
        return globals.fxRunner.sendEvent('adminsUpdated', [1, 5, 7]);
    } else if (action == 'getLoggerErrors') {
        const outData = {
            admin: globals.logger.admin.lrLastError,
            fxserver: globals.logger.fxserver.lrLastError,
            server: globals.logger.server.lrLastError,
        };
        return ctx.send({ type: 'success', message: JSON.stringify(outData, null, 2) });
    } else if (action == 'testSrcAddress') {
        const url = 'https://api.myip.com';
        const respDefault = await got(url).json();
        const respReset = await got(url, { localAddress: undefined }).json();
        const outData = {
            url,
            respDefault,
            respReset,
        };
        return ctx.send({ type: 'success', message: JSON.stringify(outData, null, 2) });
    } else if (action == 'getProcessEnv') {
        return ctx.send({ type: 'success', message: JSON.stringify(process.env, null, 2) });
    } else if (action == 'setHbDataTracking') {
        globals.tmpSetHbDataTracking = true;
        return ctx.send({ type: 'success', message: 'done' });
    } else if (action == 'snap') {
        setTimeout(() => {
            // if (Citizen && Citizen.snap) Citizen.snap();
            const snapFile = v8.writeHeapSnapshot();
            console.warn(`Heap snapshot written to: ${snapFile}`);
        }, 50);
        return ctx.send({ type: 'success', message: 'terminal' });
    } else if (action == 'gc') {
        if (typeof global.gc === 'function') {
            global.gc();
            return ctx.send({ type: 'success', message: 'done' });
        } else {
            return ctx.send({ type: 'danger', message: 'GC is not exposed' });
        }
    } else if (action.startsWith('playerDrop')) {
        const reason = action.split(' ', 2)[1];
        const category = globals.statsManager.playerDrop.handlePlayerDrop(reason);
        return ctx.send({ type: 'success', message: category });
    } else if (action == 'xxxxxx') {
        // const res = globals.playerDatabase.xxxxx();
        // console.dir(res);
        return ctx.send({ type: 'success', message: 'terminal' });
    }

    //Catch all
    return ctx.send({ type: 'danger', message: '<strong>Unknown action :(</strong>' });
};
