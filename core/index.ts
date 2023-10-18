import TxAdmin from './txAdmin';
import { convars } from './globalData';
import checkPreRelease from '@core/extras/checkPreRelease';
import consoleFactory, { setTTYTitle } from '@extras/console';
const console = consoleFactory();


/**
 * Starting txAdmin (have fun :p)
 */
const serverProfile = GetConvar('serverProfile', 'default').replace(/[^a-z0-9._-]/gi, '').trim();
if (serverProfile.endsWith('.base')) {
    console.error(`Looks like the folder named '${serverProfile}' is actually a deployed base instead of a profile.`);
    process.exit(200);
}
if (!serverProfile.length) {
    console.error('Invalid server profile name. Are you using Google Translator on the instructions page? Make sure there are no additional spaces in your command.');
    process.exit(201);
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
        const now = Date.now();
        if (now - hdTimer > 2000) {
            console.majorMultilineError([
                'Major VPS freeze/lag detected!',
                'THIS IS NOT AN ERROR CAUSED BY TXADMIN!',
            ]);
        }
        hdTimer = now;
    }, 500);
}, 10_000);

//Handle any stdio error
process.stdin.on('error', (data) => { });
process.stdout.on('error', (data) => { });
process.stderr.on('error', (data) => { });

//Handle "the unexpected"
process.on('unhandledRejection', (err: Error) => {
    //We are handling this inside the DiscordBot component
    if (err.message === 'Used disallowed intents') return;

    console.error('Ohh nooooo - unhandledRejection');
    console.dir(err);
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
    //totally ignoring the warning, we know this is bad and shouldn't happen
    if (warning.name === 'UnhandledPromiseRejectionWarning') return;

    if (warning.name !== 'ExperimentalWarning' || convars.isDevMode) {
        console.dir(warning);
    }
});
