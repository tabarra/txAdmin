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
    database: null,
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
    serverProfile = process.argv[2].replace(/[^a-z0-9._-]/gi, "").trim();
    if(!serverProfile.length){
        logError(`Invalid server profile. Are you using Google Translator on the Github instructions page? Make sure there are no additional spaces in your command.`);
        process.exit();
    }else if(serverProfile === 'example'){
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
//Freeze detector
let hdTimer = Date.now();
setInterval(() => {
    let now = Date.now();
    if(now - hdTimer > 2000){
        let sep = `=`.repeat(72);
        setTimeout(() => {
            logError(sep);
            logError('Major process freeze detected.');
            if(process.env.os.toLowerCase().includes('windows')){
                logError(`If using CMD or a 'start.bat' file, make sure to disable QuickEdit mode.`);
                logError(`Join our Discord and type '!quickedit' for instructions.`);
            }
            logError('THIS IS NOT AN ERROR CAUSED BY TXADMIN! Your VPS might be lagging out.');
            logError(sep);
        }, 1000);
    }
    hdTimer = now;
}, 500);

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
