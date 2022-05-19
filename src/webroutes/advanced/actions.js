//Requires
const modulename = 'WebServer:AdvancedActions';
const bytes = require('bytes');
const humanizeDuration = require('humanize-duration');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const got = require('../../extras/got');

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined'); };
const now = () => { return Math.round(Date.now() / 1000); };


/**
 *
 * @param {object} ctx
 */
module.exports = async function AdvancedActions(ctx) {
    //Sanity check
    if (
        isUndefined(ctx.request.body.action)
        || isUndefined(ctx.request.body.parameter)
    ) {
        logWarn('Invalid request!');
        return ctx.send({type: 'danger', message: '<strong>Invalid request :(</strong>'});
    }
    const action = ctx.request.body.action;
    const parameter = ctx.request.body.parameter;


    //Check permissions
    if (!ctx.utils.checkPermission('all_permissions', modulename)) {
        return ctx.send({
            type: 'danger',
            message: 'You don\'t have permission to execute this action.',
        });
    }

    //Action: Change Verbosity
    if (action == 'change_verbosity') {
        GlobalData.verbose = (parameter == 'true');
        globals.fxRunner.resetConvars();
        return ctx.send({refresh:true});
    } else if (action == 'perform_magic') {
        const message = JSON.stringify(globals.playerController.activePlayers, null, 2);
        return ctx.send({type: 'success', message});
    } else if (action == 'perform_magic2') {
        globals.playerController.playerlistGenerator.indexes = [];
        return ctx.send({type: 'success', message: 'clearing generator playerlist'});
    } else if (action == 'perform_magic3') {
        if (globals.playerController.playerlistGenerator.indexes.length) {
            globals.playerController.playerlistGenerator.indexes = [];
        } else {
            globals.playerController.playerlistGenerator.indexes = [0, 1];
        }
        return ctx.send({type: 'success', message: 'kick\'em all, or unkick\'em all'});
    } else if (action == 'perform_magic4') {
        let idArray = ['license:23fb884f1463da603330b9d4434f2886a725aaaa'];
        let ts = now();
        const filter = (x) => {
            return (
                // (x.type == 'ban') &&
                (x.type == 'ban' || x.type == 'whitelist')
                && (!x.expiration || x.expiration > ts)
                && (!x.revocation.timestamp)
            );
        };

        let hist = await globals.playerController.getRegisteredActions(idArray, filter);
        return ctx.send({type: 'success', message: JSON.stringify(hist, null, 2)});
    } else if (action == 'show_db') {
        const dbo = globals.playerController.getDB();
        dir(dbo);
        return ctx.send({type: 'success', message: JSON.stringify(dbo, null, 2)});
    } else if (action == 'wipe_db') {
        const dbo = globals.playerController.getDB();
        await dbo.set('players', []).set('actions', []).set('pendingWL', []).write();
        return ctx.send({type: 'success', message: 'wiiiiiiiiped'});
    } else if (action == 'show_log') {
        return ctx.send({type: 'success', message: JSON.stringify(globals.logger.server.getRecentBuffer(), null, 2)});
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
        return ctx.send({type: 'success', message: memory});
    } else if (action == 'joinCheckHistory') {
        let outData;
        try {
            const currTime = Date.now();
            const log = globals.databus.joinCheckHistory.map((e) => {
                return {
                    when: humanizeDuration(currTime - e.ts, {round: true}),
                    playerName: e.playerName,
                    idArray: e.idArray,
                };
            });
            outData = JSON.stringify(log, null, 2);
        } catch (error) {
            outData = error.message;
        }
        return ctx.send({type: 'success', message: outData});
    } else if (action == 'freeze') {
        logWarn('Freezing process for 50 seconds.');
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50 * 1000);
    } else if (action == 'resetConvars') {
        globals.fxRunner.resetConvars();
        return ctx.send({refresh:true});
    } else if (action == 'backupdb') {
        await globals.playerController.db.backupDatabase();
        return ctx.send({type: 'success', message: 'backing it up'});
    } else if (action == 'reauth') {
        // txaEvent "adminsUpdated" "[1,5,7]"
        return globals.fxRunner.sendEvent('adminsUpdated', [1, 5, 7]);
    } else if (action == 'getLoggerErrors') {
        const outData = {
            admin: globals.logger.admin.lrLastError,
            fxserver: globals.logger.fxserver.lrLastError,
            server: globals.logger.server.lrLastError,
        };
        return ctx.send({type: 'success', message: JSON.stringify(outData, null, 2)});
    } else if (action == 'testSrcAddress') {
        const url = 'https://api.myip.com';
        const respDefault = await got(url).json();
        const respReset = await got(url, {localAddress: undefined}).json();
        const outData = {
            url,
            respDefault,
            respReset,
        };
        return ctx.send({type: 'success', message: JSON.stringify(outData, null, 2)});
    }

    //Catch all
    return ctx.send({type: 'danger', message: '<strong>Unknown action :(</strong>'});
};
