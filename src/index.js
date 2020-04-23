//Checking Environment
try {
    if(!IsDuplicityVersion()) throw new Error();
} catch (error) {
    console.log(`txAdmin must be run inside fxserver in monitor mode.`);
    process.exit();
}
require('./extras/helpers').dependencyChecker();

//Requires
const os = require('os');
const fs = require('fs');
const path = require('path');
const slash = require('slash');
const { dir, log, logOk, logWarn, logError, cleanTerminal, setTTYTitle } = require('./extras/console')();

//Helpers
const cleanPath = (x) => { return slash(path.normalize(x)) };
const logDie = (x) => {
    logError(x);
    process.exit(1);
}
const getBuild = (ver)=>{
    try {
        let regex = /v1\.0\.0\.(\d{4,5})\s*/;
        let res = regex.exec(ver);
        return parseInt(res[1]);
    } catch (error) {
        return 0;
    }
}

//==============================================================
//Get OSType
const osTypeVar = os.type();
let osType;
if(osTypeVar == 'Windows_NT'){
    osType = 'windows'
}else if(osTypeVar == 'Linux'){
    osType = 'linux'
}else{
    logDie(`OS type not supported: ${osTypeVar}`)
}

//Get resource name
const resourceName = GetCurrentResourceName();

//Getting fxserver version
const fxServerVersion = getBuild(GetConvar('version', 'false'));
if(!fxServerVersion){
    logDie(`This version of FXServer is NOT compatible with txAdmin v2. Please update it to build 2310 or above. (version convar not set or in the wrong format)`);
}

//Getting txAdmin version
const txAdminVersion = GetResourceMetadata(resourceName, 'version');
if(typeof txAdminVersion !== 'string' || txAdminVersion == 'null'){
    logDie(`txAdmin version not set or in the wrong format`);
}

//Get txAdmin Resource Path
let txAdminResourcePath;
let txAdminResourcePathConvar = GetResourcePath(resourceName);
if(typeof txAdminResourcePathConvar !== 'string' || txAdminResourcePathConvar == 'null'){
    logDie(`Could not resolve txAdmin resource path`);
}else{
    txAdminResourcePath = cleanPath(txAdminResourcePathConvar);
}

//Get citizen Root
let citizenRootConvar = GetConvar('citizen_root', 'false');
if(citizenRootConvar == 'false'){
    logDie(`citizen_root convar not set`);
}
const fxServerPath = cleanPath(citizenRootConvar);

//Setting data path
let dataPath;
let txDataPathConvar = GetConvar('txDataPath', 'false');
if(txDataPathConvar == 'false'){
    let dataPathSuffix = (osType == 'windows')? '..' : '../../../';
    dataPath = cleanPath(path.join(fxServerPath, dataPathSuffix, 'txData'));
    log(`Version ${txAdminVersion} using data path '${dataPath}'`);
}else{
    dataPath = cleanPath(txDataPathConvar);
}
try {
    if(!fs.existsSync(dataPath)) fs.mkdirSync(dataPath);
} catch (error) {
    logDie(`Failed to check or create '${dataPath}' with error: ${error.message}`);
}

//Get Web Port
let txAdminPortConvar = GetConvar('txAdminPort', '40120').trim();
let digitRegex = /^\d+$/;
if(!digitRegex.test(txAdminPortConvar)){
    logDie(`txAdminPort is not valid.`);
}
const txAdminPort = parseInt(txAdminPortConvar);

//Get profile name
const serverProfile = GetConvar('serverProfile', 'default').replace(/[^a-z0-9._-]/gi, "").trim();
if(!serverProfile.length){
    logDie(`Invalid server profile name. Are you using Google Translator on the instructions page? Make sure there are no additional spaces in your command.`);
}

//Get verbosity
let txAdminVerboseConvar = GetConvar('txAdminVerbose', 'false').trim();
const verbose = (['true', '1', 'on'].includes(txAdminVerboseConvar));

//Setting Global Data
GlobalData = {
    osType,
    resourceName,
    fxServerVersion,
    txAdminVersion,
    txAdminResourcePath,
    fxServerPath,
    dataPath,
    txAdminPort,
    verbose,
    cfxUrl: null,
}
// NOTE: all variables set for monitor mode: monitorMode, version, serverRoot (cwd), citizen_root, citizen_dir

//==============================================================
//Starting txAdmin (have fun :p)
setTTYTitle(serverProfile);
const txAdmin = require('./txAdmin.js');
const app = new txAdmin(serverProfile);


//==============================================================
//Freeze detector - starts after 10 seconds
setTimeout(() => {
    let hdTimer = Date.now();
    setInterval(() => {
        let now = Date.now();
        if(now - hdTimer > 2000){
            let sep = `=`.repeat(70);
            setTimeout(() => {
                logError(sep);
                logError('Major VPS freeze/lag detected!');
                logError('THIS IS NOT AN ERROR CAUSED BY TXADMIN!');
                logError(sep);
            }, 1000);
        }
        hdTimer = now;
    }, 500);
}, 10000);

//Handle any stdio error
process.stdin.on('error', (data) => {});
process.stdout.on('error', (data) => {});
process.stderr.on('error', (data) => {});

//Handle "the unexpected"
process.on('unhandledRejection', (err) => {
    logError("Ohh nooooo - unhandledRejection")
    logError(err.message)
    dir(err.stack)
});
process.on('uncaughtException', function(err) {
    logError("Ohh nooooo - uncaughtException")
    logError(err.message)
    dir(err.stack)
});
process.on('exit', (code) => {
    log("Stopping txAdmin");
});
