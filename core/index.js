import TxAdmin from './txAdmin';
import logger from '@core/extras/console';
import { txEnv, convars } from './globalData.js';
const { dir, log, logOk, logWarn, logError, setTTYTitle } = logger();



/**
 * Starting txAdmin (have fun :p)
 */
setTTYTitle(txEnv.txAdminVersion, convars.serverProfile);
new TxAdmin(convars.serverProfile);
// (async () => {
//     const { default: TxAdmin } = await import('./txAdmin');
// })();


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
