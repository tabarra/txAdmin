import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import slash from 'slash';

import logger from '@core/extras/console.js';
const { dir, log, logOk, logWarn, logError } = logger();


/**
 * Helpers
 */
const cleanPath = (x) => { return slash(path.normalize(x)); };
const logDie = (x) => {
    logError(x);
    process.exit(1);
};
const getBuild = (ver) => {
    try {
        const res = /v1\.0\.0\.(\d{4,5})\s*/.exec(ver);
        return parseInt(res[1]);
    } catch (error) {
        return 9999;
    }
};
const getConvarBool = (convarName) => {
    const cvar = GetConvar(convarName, 'false').trim().toLowerCase();
    return ['true', '1', 'on'].includes(cvar);
};
const getConvarString = (convarName) => {
    const cvar = GetConvar(convarName, 'false').trim();
    return (cvar === 'false') ? false : cvar;
};


/**
 * txAdmin Env
 */
//Get OSType
const osTypeVar = os.type();
let osType, isWindows;
if (osTypeVar == 'Windows_NT') {
    osType = 'windows';
    isWindows = true;
} else if (osTypeVar == 'Linux') {
    osType = 'linux';
    isWindows = false;
} else {
    logDie(`OS type not supported: ${osTypeVar}`);
}

//Get resource name
const resourceName = GetCurrentResourceName();

//Getting fxserver version
//4380 = GetVehicleType was exposed server-side
//4548 = more or less when node v16 was added
//4574 = add missing PRINT_STRUCTURED_TRACE declaration
//4574 = add resource field to PRINT_STRUCTURED_TRACE
const minFXServerVersion = 4574;
const fxServerVersion = getBuild(getConvarString('version'));
if (fxServerVersion === 9999) {
    logError('It looks like you are running a custom build of fxserver.');
    logError('And because of that, there is no guarantee that txAdmin will work properly.');
} else if (!fxServerVersion) {
    logDie(`This version of FXServer is NOT compatible with txAdmin. Please update it to build ${minFXServerVersion} or above. (version convar not set or in the wrong format)`);
} else if (fxServerVersion < minFXServerVersion) {
    logDie(`This version of FXServer is too outdated and NOT compatible with txAdmin, please update to artifact/build ${minFXServerVersion} or newer!`);
}

//Getting txAdmin version
const txAdminVersion = GetResourceMetadata(resourceName, 'version');
if (typeof txAdminVersion !== 'string' || txAdminVersion == 'null') {
    logDie('txAdmin version not set or in the wrong format');
}

//Get txAdmin Resource Path
let txAdminResourcePath;
const txAdminResourcePathConvar = GetResourcePath(resourceName);
if (typeof txAdminResourcePathConvar !== 'string' || txAdminResourcePathConvar == 'null') {
    logDie('Could not resolve txAdmin resource path');
} else {
    txAdminResourcePath = cleanPath(txAdminResourcePathConvar);
}

//Get citizen Root
const citizenRootConvar = getConvarString('citizen_root');
if (!citizenRootConvar) {
    logDie('citizen_root convar not set');
}
const fxServerPath = cleanPath(citizenRootConvar);

//Setting data path
let dataPath;
const txDataPathConvar = getConvarString('txDataPath');
if (!txDataPathConvar) {
    const dataPathSuffix = (isWindows) ? '..' : '../../../';
    dataPath = cleanPath(path.join(fxServerPath, dataPathSuffix, 'txData'));
} else {
    dataPath = cleanPath(txDataPathConvar);
}
try {
    if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath);
} catch (error) {
    logDie(`Failed to check or create '${dataPath}' with error: ${error.message}`);
}

//Check paths for non-ASCII characters
//NOTE: Non-ASCII in one of those paths (don't know which) will make NodeJS crash due to a bug in v8 (or something)
//      when running localization methods like Date.toLocaleString().
//      There was also an issue with the slash() lib and with the +exec on FXServer
const nonASCIIRegex = /[^\x00-\x80]+/;
if (nonASCIIRegex.test(fxServerPath) || nonASCIIRegex.test(dataPath)) {
    logError('Due to environmental restrictions, your paths CANNOT contain non-ASCII characters.');
    logError('Example of non-ASCII characters: çâýå, ρέθ, ñäé, ēļæ, глж, เซิร์, 警告.');
    logError('Please make sure FXServer is not in a path contaning those characters.');
    logError(`If on windows, we suggest you moving the artifact to "C:/fivemserver/${fxServerVersion}/".`);
    log(`FXServer path: ${fxServerPath}`);
    log(`txData path: ${dataPath}`);
    process.exit(1);
}


/**
 * Convars - Debug
 */
const isDevMode = getConvarBool('txAdminDevMode');
const verboseConvar = getConvarBool('txAdminVerbose');
const debugPlayerlistGenerator = getConvarBool('txDebugPlayerlistGenerator');
const debugExternalSource = getConvarString('txDebugExternalSource');


/**
 * Convars - ZAP dependant
 */
//Checking for ZAP Configuration file
const zapCfgFile = path.join(dataPath, 'txAdminZapConfig.json');
let zapCfgData, isZapHosting, forceInterface, forceFXServerPort, txAdminPort, loginPageLogo, defaultMasterAccount, deployerDefaults;
const loopbackInterfaces = ['::1', '127.0.0.1', '127.0.1.1'];
if (fs.existsSync(zapCfgFile)) {
    log('Loading ZAP-Hosting configuration file.');
    try {
        zapCfgData = JSON.parse(fs.readFileSync(zapCfgFile));
        isZapHosting = true;
        forceInterface = zapCfgData.interface;
        forceFXServerPort = zapCfgData.fxServerPort;
        txAdminPort = zapCfgData.txAdminPort;
        loginPageLogo = zapCfgData.loginPageLogo;
        defaultMasterAccount = false;
        deployerDefaults = {
            license: zapCfgData.defaults.license,
            maxClients: zapCfgData.defaults.maxClients,
            mysqlHost: zapCfgData.defaults.mysqlHost,
            mysqlPort: zapCfgData.defaults.mysqlPort,
            mysqlUser: zapCfgData.defaults.mysqlUser,
            mysqlPassword: zapCfgData.defaults.mysqlPassword,
            mysqlDatabase: zapCfgData.defaults.mysqlDatabase,
        };
        if (zapCfgData.customer) {
            if (typeof zapCfgData.customer.name !== 'string') throw new Error('customer.name is not a string.');
            if (zapCfgData.customer.name.length < 3) throw new Error('customer.name too short.');
            if (typeof zapCfgData.customer.password_hash !== 'string') throw new Error('customer.password_hash is not a string.');
            if (!zapCfgData.customer.password_hash.startsWith('$2y$')) throw new Error('customer.password_hash is not a bcrypt hash.');
            defaultMasterAccount = {
                name: zapCfgData.customer.name,
                password_hash: zapCfgData.customer.password_hash,
            };
        }

        loopbackInterfaces.push(forceInterface);

        if (!isDevMode) fs.unlinkSync(zapCfgFile);
    } catch (error) {
        logDie(`Failed to load with ZAP-Hosting configuration error: ${error.message}`);
    }
} else {
    isZapHosting = false;
    forceFXServerPort = false;
    loginPageLogo = false;
    defaultMasterAccount = false;
    deployerDefaults = false;

    const txAdminPortConvar = GetConvar('txAdminPort', '40120').trim();
    if (!/^\d+$/.test(txAdminPortConvar)) logDie('txAdminPort is not valid.');
    txAdminPort = parseInt(txAdminPortConvar);

    const txAdminInterfaceConvar = getConvarString('txAdminInterface');
    if (!txAdminInterfaceConvar) {
        forceInterface = false;
    } else {
        if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(txAdminInterfaceConvar)) logDie('txAdminInterface is not valid.');
        forceInterface = txAdminInterfaceConvar;
    }
}
if (verboseConvar) dir({ isZapHosting, forceInterface, forceFXServerPort, txAdminPort, loginPageLogo, deployerDefaults });


/**
 * Exports
 */
export const txEnv = Object.freeze({
    osType,
    isWindows,
    fxServerVersion,
    txAdminVersion,
    txAdminResourcePath,
    fxServerPath,
    dataPath
});

export const convars = Object.freeze({
    //Convars - Debug
    isDevMode,
    debugPlayerlistGenerator,
    debugExternalSource,
    //Convars - zap dependant
    isZapHosting,
    forceInterface,
    forceFXServerPort,
    txAdminPort,
    loginPageLogo,
    defaultMasterAccount,
    deployerDefaults,
    loopbackInterfaces,
});

//Verbosity can change during execution
//FIXME: move this to console.js
export let verbose = verboseConvar;
export const setVerbose = (state) => {
    verbose = !!state;
}
