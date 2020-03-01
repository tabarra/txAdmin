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
const osType = os.type();

//Getting fxserver version
const fxServerVersion = getBuild(GetConvar('version', 'false'));
if(!fxServerVersion){
    logError(`version convar not set or in the wrong format`);
    process.exit();
}

//Getting txAdmin version
const txAdminVersion = GetResourceMetadata(GetCurrentResourceName(), 'version');
if(typeof txAdminVersion !== 'string' || txAdminVersion == 'null'){
    logError(`txAdmin version not set or in the wrong format`);
    process.exit();
}

//Get txAdmin Resource Path
let txAdminResourcePath;
let txAdminResourcePathConvar = GetResourcePath(GetCurrentResourceName());
if(typeof txAdminResourcePathConvar !== 'string' || txAdminResourcePathConvar == 'null'){
    logError(`Could not resolve txAdmin resource path`);
    process.exit();
}else{
    txAdminResourcePath = cleanPath(txAdminResourcePathConvar);
}

//Get citizen Root
let citizenRootConvar = GetConvar('citizen_root', 'false');
if(citizenRootConvar == 'false'){
    logError(`citizen_root convar not set`);
    process.exit();
}
const fxServerPath = cleanPath(citizenRootConvar);

//Setting data path
let dataPath;
let txDataPathConvar = GetConvar('txDataPath', 'false');
if(txDataPathConvar == 'false'){
    let dataPathSuffix = (osType == 'Windows_NT')? '..' : '../../../';
    dataPath = cleanPath(path.join(fxServerPath, dataPathSuffix, 'txData'));
    log(`txData convar not specified, assuming: ${dataPath}`);
}else{
    dataPath = cleanPath(txDataPathConvar);
}
try {
    if(!fs.existsSync(dataPath)) fs.mkdirSync(dataPath);
} catch (error) {
    logError(`Failed to check or create '${dataPath}' with error: ${error.message}`);
    process.exit();
}

//Get Web Port
let txAdminPortConvar = GetConvar('txAdminPort', '40120').trim();
let digitRegex = /^\d+$/;
if(!digitRegex.test(txAdminPortConvar)){
    logError(`txAdminPort is not valid.`);
    process.exit();
}
const txAdminPort = parseInt(txAdminPortConvar);

//Get profile name
const serverProfile = GetConvar('serverProfile', 'default').replace(/[^a-z0-9._-]/gi, "").trim();
if(!serverProfile.length){
    logError(`Invalid server profile name. Are you using Google Translator on the instructions page? Make sure there are no additional spaces in your command.`);
    process.exit();
}
log(`Server profile selected: '${serverProfile}'`);

//Setting Global Data
GlobalData = {
    osType,
    fxServerVersion,
    txAdminVersion,
    txAdminResourcePath,
    fxServerPath,
    dataPath,
    txAdminPort,
    cfxUrl: null
}


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
}, 10000);

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
