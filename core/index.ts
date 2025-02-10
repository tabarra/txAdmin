//NOTE: must be imported first to setup the environment
import { txEnv } from './globalData';
import consoleFactory, { setTTYTitle } from '@lib/console';

//Can be imported after
import fs from 'node:fs';
import checkPreRelease from './boot/checkPreRelease';
import fatalError from '@lib/fatalError';
import { ensureProfileStructure, setupProfile } from './boot/setup';
import setupProcessHandlers from './boot/setupProcessHandlers';
import bootTxAdmin from './txAdmin';
const console = consoleFactory();


//Early process stuff
setupProcessHandlers();
setTTYTitle(txEnv.profile);
checkPreRelease();


//Setting up txData & Profile
try {
    if (!fs.existsSync(txEnv.dataPath)) {
        fs.mkdirSync(txEnv.dataPath);
    }
} catch (error) {
    fatalError.Boot(1, [
        `Failed to check or create the data folder.`,
        ['Path', txEnv.dataPath],
    ], error);
}
try {
    if (fs.existsSync(txEnv.profilePath)) {
        ensureProfileStructure();
    } else {
        setupProfile();
    }
} catch (error) {
    fatalError.Boot(2, [
        `Failed to check or create the txAdmin profile folder.`,
        ['Profile', txEnv.profile],
        ['Data Path', txEnv.dataPath],
        ['Profile Path', txEnv.profilePath],
    ], error);
}


//Start txAdmin (have fun 😀)
console.log(`Starting profile '${txEnv.profile}' on v${txEnv.txaVersion}/b${txEnv.fxsVersionDisplay}`);
try {
    bootTxAdmin();
} catch (error) {
    fatalError.Boot(3, 'Failed to start txAdmin.', error);
}


//Freeze detector - starts after 10 seconds due to the initial bootup lag
const bootGracePeriod = 15_000;
const loopInterval = 500;
const loopElapsedLimit = 2_000;
setTimeout(() => {
    let hdTimer = Date.now();
    setInterval(() => {
        const now = Date.now();
        if (now - hdTimer > loopElapsedLimit) {
            console.majorMultilineError([
                'Major VPS freeze/lag detected!',
                'THIS IS NOT AN ERROR CAUSED BY TXADMIN!',
            ]);
        }
        hdTimer = now;
    }, loopInterval);
}, bootGracePeriod);
