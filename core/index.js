import TxAdmin from './txAdmin';
import logger from '@core/extras/console';
import { txEnv } from './globalData.js';
import checkPreRelease from '@core/extras/checkPreRelease.js';
const { dir, log, logOk, logWarn, logError, setTTYTitle } = logger();


/**
 * Starting txAdmin (have fun :p)
 */
const serverProfile = GetConvar('serverProfile', 'default').replace(/[^a-z0-9._-]/gi, '').trim();
if (serverProfile.endsWith('.base')) {
    logDie(`Looks like the folder named '${serverProfile}' is actually a deployed base instead of a profile.`);
}
if (!serverProfile.length) {
    logDie('Invalid server profile name. Are you using Google Translator on the instructions page? Make sure there are no additional spaces in your command.');
}

setTTYTitle(txEnv.txAdminVersion, serverProfile);
checkPreRelease();
new TxAdmin(serverProfile);


/**
 * Process handling stuff
 */
//Freeze detector - starts after 10 seconds
setTimeout(() => {
    let hdTimer = Date.now();
    setInterval(() => {
        let now = Date.now();
        if (now - hdTimer > 2000) {
            let sep = '='.repeat(70);
            setTimeout(() => {
                logError(sep);
                logError('Major VPS freeze/lag detected!');
                logError('THIS IS NOT AN ERROR CAUSED BY TXADMIN!');
                logError(sep);
            }, 1000);
        }
        hdTimer = now;
    }, 500);
}, 10000);

//Handle any stdio error
process.stdin.on('error', (data) => { });
process.stdout.on('error', (data) => { });
process.stderr.on('error', (data) => { });

//Handle "the unexpected"
process.on('unhandledRejection', (err) => {
    logError('Ohh nooooo - unhandledRejection');
    logError(err.message);
    dir(err.stack);
});
process.on('uncaughtException', function (err) {
    logError('Ohh nooooo - uncaughtException');
    logError(err.message);
    dir(err.stack);
});
process.on('exit', (code) => {
    log('Stopping txAdmin');
});
// Error.stackTraceLimit = 25;
// process.on('warning', (warning) => {
//     dir(warning);
// });
