const modulename = 'WebServer:AdvancedActions';
import v8 from 'node:v8';
import bytes from 'bytes';
import got from '@lib/got';
import consoleFactory from '@lib/console';
import { SYM_SYSTEM_AUTHOR } from '@lib/symbols';
const console = consoleFactory(modulename);

//Helper functions
const isUndefined = (x) => (x === undefined);


/**
 * Endpoint for running advanced commands - basically, should not ever be used
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
        //temp disabled because the verbosity convar is not being set by this method
        return ctx.send({ refresh: true });
    } else if (action == 'perform_magic') {
        const message = JSON.stringify(txCore.fxPlayerlist.getPlayerList(), null, 2);
        return ctx.send({ type: 'success', message });
    } else if (action == 'show_db') {
        const dbo = txCore.database.getDboRef();
        console.dir(dbo);
        return ctx.send({ type: 'success', message: JSON.stringify(dbo, null, 2) });
    } else if (action == 'show_log') {
        return ctx.send({ type: 'success', message: JSON.stringify(txCore.logger.server.getRecentBuffer(), null, 2) });
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
    } else if (action == 'updateMutableConvars') {
        txCore.fxRunner.updateMutableConvars();
        return ctx.send({ refresh: true });
    } else if (action == 'reauthLast10Players') {
        // force refresh the admin status of the last 10 players to join
        const lastPlayers = txCore.fxPlayerlist.getPlayerList().map((p) => p.netid).slice(-10);
        txCore.fxRunner.sendEvent('adminsUpdated', lastPlayers);
        return ctx.send({ type: 'success', message: `refreshed: ${JSON.stringify(lastPlayers)}` });
    } else if (action == 'getLoggerErrors') {
        const outData = {
            admin: txCore.logger.admin.lrLastError,
            fxserver: txCore.logger.fxserver.lrLastError,
            server: txCore.logger.server.lrLastError,
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
    } else if (action == 'snap') {
        setTimeout(() => {
            // if (Citizen && Citizen.snap) Citizen.snap();
            const snapFile = v8.writeHeapSnapshot();
            console.warn(`Heap snapshot written to: ${snapFile}`);
        }, 50);
        return ctx.send({ type: 'success', message: 'terminal' });
    } else if (action === 'gc') {
        if (typeof global.gc === 'function') {
            global.gc();
            return ctx.send({ type: 'success', message: 'done' });
        } else {
            return ctx.send({ type: 'danger', message: 'GC is not exposed' });
        }
    } else if (action === 'safeEnsureMonitor') {
        const setCmdResult = txCore.fxRunner.sendCommand(
            'set',
            [
                'txAdmin-luaComToken',
                txCore.webServer.luaComToken,
            ],
            SYM_SYSTEM_AUTHOR
        );
        if (!setCmdResult) {
            return ctx.send({ type: 'danger', message: 'Failed to reset luaComToken.' });
        }
        const ensureCmdResult = txCore.fxRunner.sendCommand(
            'ensure',
            ['monitor'],
            SYM_SYSTEM_AUTHOR
        );
        if (ensureCmdResult) {
            return ctx.send({ type: 'success', message: 'done' });
        } else {
            return ctx.send({ type: 'danger', message: 'Failed to ensure monitor.' });
        }
    } else if (action.startsWith('playerDrop')) {
        const reason = action.split(' ', 2)[1];
        const category = txCore.metrics.playerDrop.handlePlayerDrop(reason);
        return ctx.send({ type: 'success', message: category });

    } else if (action.startsWith('set')) {
        // set general.language "pt"
        // set general.language "en"
        // set server.onesync "on"
        // set server.onesync "legacy"
        try {
            const [_, scopeKey, valueJson] = action.split(' ', 3);
            if (!scopeKey || !valueJson) throw new Error(`Invalid set command: ${action}`);
            const [scope, key] = scopeKey.split('.');
            if (!scope || !key) throw new Error(`Invalid set command: ${action}`);
            const configUpdate = { [scope]: { [key]: JSON.parse(valueJson) } };
            const storedKeysChanges = txCore.configStore.saveConfigs(configUpdate, ctx.admin.name);
            const outParts = [
                'Keys Updated: ' + JSON.stringify(storedKeysChanges ?? 'not set', null, 2),
                '-'.repeat(16),
                'Stored:' + JSON.stringify(txCore.configStore.getStoredConfig(), null, 2),
            ];
            return ctx.send({ type: 'success', message: outParts.join('\n') });
        } catch (error) {
            return ctx.send({ type: 'danger', message: error.message });
        }

    } else if (action == 'printFxRunnerChildHistory') {
        const message = JSON.stringify(txCore.fxRunner.history, null, 2)
        return ctx.send({ type: 'success', message });

    } else if (action == 'xxxxxx') {
        return ctx.send({ type: 'success', message: '😀👍' });
    }

    //Catch all
    return ctx.send({ type: 'danger', message: '<strong>Unknown action :(</strong>' });
};
