import TxAdmin from './txAdmin';
import {  convars } from './globalData';
import checkPreRelease from '@core/extras/checkPreRelease';
import consoleFactory, { setTTYTitle } from '@extras/newConsole';
const console = consoleFactory();


/**
 * Starting txAdmin (have fun :p)
 */
const logDie = (x: string) => {
    console.error(x);
    process.exit(1);
};
const serverProfile = GetConvar('serverProfile', 'default').replace(/[^a-z0-9._-]/gi, '').trim();
if (serverProfile.endsWith('.base')) {
    logDie(`Looks like the folder named '${serverProfile}' is actually a deployed base instead of a profile.`);
}
if (!serverProfile.length) {
    logDie('Invalid server profile name. Are you using Google Translator on the instructions page? Make sure there are no additional spaces in your command.');
}

setTTYTitle(serverProfile);
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
                console.error(sep);
                console.error('Major VPS freeze/lag detected!');
                console.error('THIS IS NOT AN ERROR CAUSED BY TXADMIN!');
                console.error(sep);
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
process.on('unhandledRejection', (err: Error) => {
    console.error('Ohh nooooo - unhandledRejection');
    console.error(err.message);
    console.dir(err.stack);
});
process.on('uncaughtException', function (err: Error) {
    console.error('Ohh nooooo - uncaughtException');
    console.error(err.message);
    console.dir(err.stack);
});
process.on('exit', (_code) => {
    console.warn('Stopping txAdmin');
});
Error.stackTraceLimit = 25;
process.removeAllListeners('warning');
process.on('warning', (warning) => {
    if (warning.name !== 'ExperimentalWarning' || convars.isDevMode) {
        console.dir(warning);
    }
});
