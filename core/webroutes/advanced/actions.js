const modulename = 'WebServer:AdvancedActions';
import bytes from 'bytes';
import humanizeDuration from 'humanize-duration';
import got from '@core/extras/got.js';
import logger, { ogConsole } from '@core/extras/console.js';
import { setVerbose } from '@core/globalData';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined'); };
const now = () => { return Math.round(Date.now() / 1000); };


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
        logWarn('Invalid request!');
        return ctx.send({ type: 'danger', message: '<strong>Invalid request :(</strong>' });
    }
    const action = ctx.request.body.action;
    const parameter = ctx.request.body.parameter;


    //Check permissions
    if (!ctx.utils.testPermission('all_permissions', modulename)) {
        return ctx.send({
            type: 'danger',
            message: 'You don\'t have permission to execute this action.',
        });
    }

    //Action: Change Verbosity
    if (action == 'change_verbosity') {
        setVerbose(parameter == 'true');
        globals.fxRunner.resetConvars();
        return ctx.send({ refresh: true });
    } else if (action == 'perform_magic') {
        const message = JSON.stringify(globals.playerlistManager.getPlayerList(), null, 2);
        return ctx.send({ type: 'success', message });
    } else if (action == 'show_db') {
        const dbo = globals.playerDatabase.getDb();
        dir(dbo);
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
    } else if (action == 'joinCheckHistory') {
        let outData;
        try {
            const currTime = Date.now();
            const log = globals.databus.joinCheckHistory.map((e) => {
                return {
                    when: humanizeDuration(currTime - e.ts, { round: true }),
                    playerName: e.playerName,
                    idArray: e.idArray,
                };
            });
            outData = JSON.stringify(log, null, 2);
        } catch (error) {
            outData = error.message;
        }
        return ctx.send({ type: 'success', message: outData });
    } else if (action == 'freeze') {
        logWarn('Freezing process for 50 seconds.');
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
    } else if (action == 'remove-all-identifiers-except-first-license-from-bans-and-warns-that-happened-after-v5-beta1') {
        //FIXME: temp - remove after beta expires
        const dbo = globals.playerDatabase.getDb();
        const cnt = {
            ban: 0,
            warn: 0,
        }
        dbo.data.actions.forEach((action) => {
            //beta1 commit && beta1 + 3w
            if (action.timestamp > 1668575245 && action.timestamp < 1670402658){
                action.identifiers = [action.identifiers[0]];
                cnt[action.type]++;
            }
        });
        
        return ctx.send({ type: 'success', message: JSON.stringify(cnt, null, 2) });
    } else if (action == 'xxxxxx') {
        // const res = globals.playerDatabase.xxxxx();
        // ogConsole.dir(res);
        return ctx.send({ type: 'success', message: 'terminal' });
    }

    //Catch all
    return ctx.send({ type: 'danger', message: '<strong>Unknown action :(</strong>' });
};
