/**
 * This file is the entrypoint called by fxserver gen8 or gen9.
 * Gen8 will start it in monitor or server mode, while Gen9 will only start it in server mode.
 * Gen9 in monitor mode starts the core/index.js script directly.
 * 
 * This script selectively loads core or the sv_reportHeap.js script based on the mode.
 * 
 * NOTE: Do not declare ANY variable at the top level of this file, even for gen9 fxs builds.
 * Due to fxs's node implementation, doing that will pollute the global scope, and the variable will
 * show up in EVERY file as if it was locally declared, which means it will not show in `Object.keys(global)`,
 * so good luck troubleshooting that. This does not affect vars inside functions or try/catch blocks.
 */


//Check if running inside FXServer
try {
    if (typeof globalThis.GetConvar !== 'function') throw new Error();
} catch (error) {
    console.log('txAdmin must be run inside FXServer in monitor mode!');
    process.exit(999);
}

//Checking monitor mode and starting
try {
    //Running inside of fxserver, check if monitor mode is enabled
    if (GetConvar('monitorMode', 'false') === 'true') {
        // console.log('This must be FXServer gen8 in tx mode');
        require('./core/index.js');
    } else if (GetConvar('txAdminServerMode', 'false') === 'true') {
        // console.log('Server, might be gen8 or gen9');
        require('./resource/sv_reportHeap.js');
    } else {
        // console.log('Probably server mode, tx disabled');
    }
} catch (error) {
    //Prevent any async console.log messing with the output
    process.stdout.write([
        'e'.repeat(80),
        `Resource load error: ${error.message}`,
        error.stack.toString(),
        'e'.repeat(80),
        ''
    ].join('\n'));
}
