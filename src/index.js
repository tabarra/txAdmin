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
const now = () => { return Math.round(Date.now() / 1000) };
const cleanPath = (x) => { return slash(path.normalize(x)) };
const logDie = (x) => {
    logError(x);
    process.exit(1);
}
const getBuild = (ver)=>{
    try {
        const res = /v1\.0\.0\.(\d{4,5})\s*/.exec(ver);
        return parseInt(res[1]);
    } catch (error) {
        logError(`It looks like you are running a custom build of fxserver.`);
        logError(`And because of that, there is no guarantee that txAdmin will work properly.`);
        return 9999;
    }
}

//==============================================================
//Make sure this user knows what he is doing...
const txAdmin1337Convar = GetConvar('txAdmin1337', 'false').trim();
if(process.env.APP_ENV !== 'webpack' && txAdmin1337Convar !== 'IKnowWhatImDoing'){
    logError(`Looks like you don't know what you are doing.`);
    logDie(`Please use the compiled release from GitHub or the version that comes with the latest FXServer.`)
}
const isAdvancedUser = (process.env.APP_ENV !== 'webpack' && txAdmin1337Convar == 'IKnowWhatImDoing');

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
    logDie(`This version of FXServer is NOT compatible with txAdmin v2. Please update it to build 2524 or above. (version convar not set or in the wrong format)`);
}
if(fxServerVersion < 2524){
    logDie(`This version of FXServer is too outdated and NOT compatible with txAdmin, please update.`);
}

//Getting txAdmin version
const txAdminVersion = GetResourceMetadata(resourceName, 'version');
if(typeof txAdminVersion !== 'string' || txAdminVersion == 'null'){
    logDie(`txAdmin version not set or in the wrong format`);
}

//Check if this version of txAdmin is too outdated to be considered safe to use in prod
//NOTE: Only valid if its being very actively maintained.
//          Use 30d for patch 0, or 45~60d otherwise
const txAdminVersionBestBy = 1612770000 + (28 * 86400); 
// dir(new Date(txAdminVersionBestBy*1000).toLocaleString()) // 08/03/2021 04:40:00 BRT 
if(now() > txAdminVersionBestBy){
    logError(`This version of txAdmin is outdated.`);
    logError(`Please update as soon as possible.`);
}

//Get txAdmin Resource Path
let txAdminResourcePath;
const txAdminResourcePathConvar = GetResourcePath(resourceName);
if(typeof txAdminResourcePathConvar !== 'string' || txAdminResourcePathConvar == 'null'){
    logDie(`Could not resolve txAdmin resource path`);
}else{
    txAdminResourcePath = cleanPath(txAdminResourcePathConvar);
}

//Get citizen Root
const citizenRootConvar = GetConvar('citizen_root', 'false');
if(citizenRootConvar == 'false'){
    logDie(`citizen_root convar not set`);
}
const fxServerPath = cleanPath(citizenRootConvar);

//Setting data path
let dataPath;
const txDataPathConvar = GetConvar('txDataPath', 'false');
if(txDataPathConvar == 'false'){
    const dataPathSuffix = (osType == 'windows')? '..' : '../../../';
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

//Check paths for non-ASCII characters
//NOTE: Non-ASCII in one of those paths (don't know which) will make NodeJS crash due to a bug in v8 (or something)
//      when running localization methods like Date.toLocaleString().
//      There was also an issue with the slash() lib and with the +exec on FXServer
const nonASCIIRegex = /[^\u0000-\u0080]+/
if(nonASCIIRegex.test(fxServerPath) || nonASCIIRegex.test(dataPath)){
    logError(`Due to environmental restrictions, your paths CANNOT contain non-ASCII characters.`);
    logError(`Example of non-ASCII characters: çâýå, ρέθ, ñäé, ēļæ, глж, เซิร์, 警告.`);
    logError(`Please make sure FXServer is not in a path contaning those characters.`);
    logError(`If on windows, we suggest you moving the artifact to "C:/fivemserver/${fxServerVersion}/".`);
    log(`FXServer path: ${fxServerPath}`);
    log(`txData path: ${dataPath}`);
    process.exit(1);
}

//Get Web Port
const txAdminPortConvar = GetConvar('txAdminPort', '40120').trim();
if(!/^\d+$/.test(txAdminPortConvar)){
    logDie(`txAdminPort is not valid.`);
}
const txAdminPort = parseInt(txAdminPortConvar);

//Get profile name
const serverProfile = GetConvar('serverProfile', 'default').replace(/[^a-z0-9._-]/gi, "").trim();
if(serverProfile.endsWith('.base')){
    logDie(`Looks like you the folder named '${serverProfile}' is actually a deployed base instead of a profile.`);
}
if(!serverProfile.length){
    logDie(`Invalid server profile name. Are you using Google Translator on the instructions page? Make sure there are no additional spaces in your command.`);
}

//Get verbosity
const txAdminVerboseConvar = GetConvar('txAdminVerbose', 'false').trim();
const verbose = (['true', '1', 'on'].includes(txAdminVerboseConvar));

//Setting Global Data
const noLookAlikesAlphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
GlobalData = {
    //Env
    isAdvancedUser,
    osType,
    resourceName,
    fxServerVersion,
    txAdminVersion,
    txAdminVersionBestBy,
    //Convars
    txAdminResourcePath,
    fxServerPath,
    dataPath,
    txAdminPort,
    verbose,
    //Consts
    validIdentifiers:{
        steam: /^steam:1100001[0-9A-Fa-f]{8}$/,
        license: /^license:[0-9A-Fa-f]{40}$/,
        xbl: /^xbl:\d{14,20}$/,
        live: /^live:\d{14,20}$/,
        discord: /^discord:\d{7,20}$/,
        fivem: /^fivem:\d{1,8}$/,
    },
    regexActionID: new RegExp(`^[${noLookAlikesAlphabet}]{4}-[${noLookAlikesAlphabet}]{4}$`),
    regexWhitelistReqID: new RegExp(`R[${noLookAlikesAlphabet}]{4}`),
    noLookAlikesAlphabet,
    //Vars
    cfxUrl: null,
}
// NOTE: all variables set for monitor mode: monitorMode, version, serverRoot (cwd), citizen_root, citizen_dir

//==============================================================
//Starting txAdmin (have fun :p)
setTTYTitle(txAdminVersion, serverProfile);
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
// Error.stackTraceLimit = 25;
// process.on('warning', (warning) => {
//     dir(warning);
// });
