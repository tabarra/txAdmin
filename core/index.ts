//NOTE: must be imported first to setup the environment
import { txDevEnv, txEnv } from './globalData';

import fs from 'node:fs';
import TxAdmin from './txAdmin';
import checkPreRelease from './boot/checkPreRelease';
import consoleFactory, { setTTYTitle } from '@lib/console';
import fatalError from '@lib/fatalError';
import { ensureProfileStructure, setupProfile } from './boot/setup';
const console = consoleFactory();


/**
 * Setting up txData & Profile
 */
try {
    if (!fs.existsSync(txEnv.dataPath)) {
        fs.mkdirSync(txEnv.dataPath);
    }
} catch (error) {
    fatalError.Boot(2, [
        `Failed to check or create the data folder.`,
        ['Path', txEnv.dataPath],
    ], error);
}
try {
    if (fs.existsSync(txEnv.profilePath)) {
        ensureProfileStructure();
    }else{
        setupProfile();
    }
} catch (error) {
    fatalError.Boot(3, [
        `Failed to check or create the txAdmin profile folder.`,
        ['Profile', txEnv.profile],
        ['Data Path', txEnv.dataPath],
        ['Profile Path', txEnv.profilePath],
    ], error);
}


/**
 * Starting txAdmin (have fun :p)
 */
setTTYTitle(txEnv.profile);
checkPreRelease();
new TxAdmin();


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

    if (warning.name !== 'ExperimentalWarning' || txDevEnv.ENABLED) {
        console.dir(warning);
    }
});
