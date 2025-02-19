import fs from 'node:fs';
import os from 'node:os';


//Constants
const signalTestTarget = os.platform() === 'win32'
    ? 'E:/TMP/signal-test-windows.txt'
    : '/root/server/signal-test-docker.txt';

const writeStdout = (message: string) => {
    process.stdout.write(message + '\n');
}
const writePadding = () => {
    process.stdout.write('.\n'.repeat(10));
}


//Proof of life
console.log('NodeJS:', process.version);
writeStdout('Starting...');
let counter = 0;
let isAwaitingShutdown = false;
setInterval(() => {
    counter++;
    const icon = isAwaitingShutdown ? '⏳' : '✅';
    writeStdout(icon + ' tick: ' + counter);
}, 250);




const removeOwnListener = () => {
    process.removeListener('SIGINT', gracefulShutdown);
    process.removeListener('SIGTERM', gracefulShutdown);
    process.removeListener('SIGHUP', gracefulShutdown);
}

const removeAllListeners = () => {
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('SIGHUP');
}



//Graceful shutdown
const gracefulShutdown: NodeJS.SignalsListener = (signal: string) => {
    if (isAwaitingShutdown) {
        writeStdout(`\n⚠️ got '${signal}' but already shutting down.\n`);
        return;
    }
    isAwaitingShutdown = true;
    const randId = Math.random().toString(36).substring(2, 15);
    const msg = [
        '-'.repeat(20),
        'Signal received: ' + signal,
        'Time: ' + new Date().toISOString(),
        'Rand: ' + randId,
        'Counter: ' + counter,
        '-'.repeat(20),
    ].join('\n');
    writeStdout(msg);

    //Trying to write a file
    try {
        fs.writeFileSync(signalTestTarget, msg + '\n');
    } catch (error) {
        writeStdout('Error writing file: ' + (error as any).message);
    }


    //Hard timeout
    setTimeout(() => {
        writeStdout('Hard timeout. Exiting...');
        removeAllListeners();
        process.exit(1);
    }, 5000);

    //Delaying the shutdown
    writeStdout('Delaying...');
    setTimeout(() => {
        writeStdout('time to die');
        try {
            fs.appendFileSync(signalTestTarget, `Dead: ${randId}\n`);
        } catch (error) {
            writeStdout('Error writing file: ' + (error as any).message);
        }
        removeOwnListener();
        writePadding();
        process.exit(0);
    }, 500);
}




//Listening to signals
try {
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGHUP', gracefulShutdown);
} catch (error) {
    writeStdout('Error listening to signals: ' + (error as any).message);
}


try {
    fs.writeFileSync(signalTestTarget, 'wiped' + Math.random().toString(36).substring(2, 15));
} catch (error) {
    writeStdout('Error writing file: ' + (error as any).message);
}


// setTimeout(() => {
//     console.log('dying');
//     process.exit(0);
// }, 5000);




// //Setting up command handler
// process.stdin.on('data', (data) => {
//     const cmd = data.toString().toLowerCase().trim();
//     if (data.toString() === '\n') {
//         console.log('='.repeat(20));
//     } else if (cmd === 'k') {
//         writeStdout('killed!');
//         process.exit(0);
//     } else if (cmd === 'c') {
//         throw new Error('crashed!');
//     } else if (cmd === 't') {
//         process.emit('SIGKILL', 'SIGKILL');
//     }
// });
// process.stdin.resume();

//yay
writeStdout('All ready: ' + process.pid);

// console.dir(os.networkInterfaces());
// console.dir(os.userInfo());

// console.log('Starting...x');
// setInterval(() => {
//     console.log('Alive');
// }, 250);
// setTimeout(() => {
//     console.log('Exiting...');
//     process.exitCode = 3;
// }, 2000);
// setImmediate(() => {
//     console.log('Running...');
// });

// process.on('beforeExit', (code) => {
//     console.log('beforeExit', code);
// });

/*

ctrl+c -> SIGINT
taskkill -f -pid 122636 -> nothing
closing window -> SIGHUP




./scripts/test_build.sh $TXDEV_FXSERVER_PATH



node alpine/opt/cfx-server/citizen/system_resources/monitor/core/index.js



TARGET_PATH=/c/Users/tabarra/Desktop/PROGRAMMING/fxserver-container/server/alpine/opt/cfx-server/citizen/system_resources/monitor
rm -rf "${TARGET_PATH}/core"
mkdir -p $TARGET_PATH
cp -r ../dist/core $TARGET_PATH
ls -la "${TARGET_PATH}/core"
*/
