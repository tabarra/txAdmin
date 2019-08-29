//Test environment conditions
const helpers = require('./extras/helpers');
helpers.dependencyChecker();

//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal, setTTYTitle } = require('./extras/console');
const txAdmin = require('./txAdmin.js');


//==============================================================
//FIXME: I should be using dependency injection or something
globals = {
    authenticator: null,
    discordBot: null,
    fxRunner: null,
    logger: null,
    monitor: null,
    translator: null,
    webConsole: null,
    webServer: null,
    config: null,
    version: {
        current: '--',
        latest: '--',
        changelog: '--',
        allVersions: []
    },
    dashboardErrorMessage: null,
    //FIXME: remove with the Extensions update
    intercomTempLog: [],
    intercomTempResList: null,
}


//==============================================================
//Print MOTD
let ascii = helpers.txAdminASCII()
let separator = '='.repeat(46);
let motd = `${separator}\n${ascii}\n${separator}`;
cleanTerminal();
setTTYTitle();
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
setTTYTitle(serverProfile);
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
