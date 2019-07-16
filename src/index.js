//Test environment conditions
const helpers = require('./extras/helpers');
helpers.dependencyChecker();

//Requires
const figlet = require('figlet');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('./extras/console');
const txAdmin = require('./txAdmin.js');


//==============================================================
//FIXME: I should be using dependency injection or something
globals = {
    monitor: null,
    logger: null,
    discordBot: null,
    authenticator: null,
    webServer: null,
    webConsole: null,
    fxRunner: null,
    config: null,
    version: {
        current: '--',
        latest: '--',
        changelog: '--',
        allVersions: []
    },
    resourceWrongVersion: null //FIXME: temp hack
}


//==============================================================
//Print MOTD
let ascii = figlet.textSync('txAdmin');
let separator = '='.repeat(46);
let motd = `${separator}\n${ascii}\n${separator}`;
cleanTerminal();
console.log(motd);

//Detect server profile
let serverProfile;
if(process.argv[2]){
    serverProfile = process.argv[2].replace(/[^a-z0-9._-]/gi, "");
    if(serverProfile === 'example'){
        logError(`You can't use the 'example' profile.`);
        process.exit();
    }
    log(`Server profile selected: '${serverProfile}'`);
}else{
    serverProfile = 'default';
    log(`Server profile not set, using 'default'`);
}

//Start txAdmin
const app = new txAdmin(serverProfile);


//==============================================================
//Handle any stdio error
process.stdin.on('error', (data) => {});
process.stdout.on('error', (data) => {});
process.stderr.on('error', (data) => {});

//Handle "the unexpected"
process.on('unhandledRejection', (err) => {
    logError(">>Ohh nooooo - unhandledRejection")
    logError(err.message)
    logError(err.stack)
});
process.on('uncaughtException', function(err) {
    logError(">>Ohh nooooo - uncaughtException")
    logError(err.message)
    logError(err.stack)
});
process.on('exit', (code) => {
    log(">>Stopping txAdmin");
});
