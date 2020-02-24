//Environment and Requires
const fs = require('fs');
const path = require('path');
const helpers = require('./extras/helpers');
helpers.dependencyChecker();
const slash = require('slash');
const { dir, log, logOk, logWarn, logError, cleanTerminal, setTTYTitle } = require('./extras/console')();

//Helpers
const cleanPath = (x) => { return slash(path.normalize(x)) };


//==============================================================
try {
    if(!IsDuplicityVersion()) throw new Error();
} catch (error) {
    console.log(`txAdmin must be run inside fxserver in monitor mode.`);
    process.exit();
}

//Get Server Root
let serverRootConvar = GetConvar('serverRoot', 'false');
if(serverRootConvar == 'false'){
    logError(`serverRoot convar not set`);
    process.exit();
}
const serverRoot = cleanPath(serverRootConvar);

//Get profile name
const serverProfile = GetConvar('serverProfile', 'default').replace(/[^a-z0-9._-]/gi, "").trim();
if(!serverProfile.length){
    logError(`Invalid server profile name. Are you using Google Translator on the instructions page? Make sure there are no additional spaces in your command.`);
    process.exit();
}else if(serverProfile === 'example'){
    logError(`You can't use the 'example' profile.`);
    process.exit();
}
log(`Server profile selected: '${serverProfile}'`);

//Checking data path
const dataPath = cleanPath(serverRoot+'/txData');
try {
    if(!fs.existsSync(dataPath)) fs.mkdirSync(dataPath);
} catch (error) {
    logError(`Failed to check or create '${dataPath}' with error: ${error.message}`);
    process.exit();
}

//Check if the profile exists and call setup if it doesn't
const profilePath = cleanPath(path.join(dataPath, serverProfile));
if(!fs.existsSync(profilePath)){
    logWarn(`Profile not found in '${dataPath}', setting folder up...`);
    try {
        const SetupScript = require('./scripts/setup.js');
        SetupScript(serverRoot, serverProfile, profilePath);
    } catch (error) {
        logError(`Failed to create profile '${serverProfile}' with error: ${error.message}`);
        process.exit();
    }
}

//Get Web Port
//NOTE: Temporarily being passed down to txAdmin > webServer to make it easier to remove when adding support for multiple servers
let txAdminPortConvar = GetConvar('txAdminPort', '40120').trim();
let digitRegex = /^\d+$/;
if(!digitRegex.test(txAdminPortConvar)){
    logError(`txAdminPort is not valid.`);
    process.exit();
}
const txAdminPort = parseInt(txAdminPortConvar);


//==============================================================
//Starting txAdmin (have fun :p)
setTTYTitle(serverProfile);
const txAdmin = require('./txAdmin.js');
const app = new txAdmin(dataPath, profilePath, serverProfile, txAdminPort);


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
            logError('THIS IS NOT AN ERROR CAUSED BY TXADMIN! Your VPS is probably lagging out.');
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
    dir(err.stack)
});
process.on('uncaughtException', function(err) {
    logError(">>Ohh nooooo - uncaughtException")
    logError(err.message)
    dir(err.stack)
});
process.on('exit', (code) => {
    log(">>Stopping txAdmin");
});
