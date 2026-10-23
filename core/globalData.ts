import path from 'node:path';
import os from 'node:os';
import semver from 'semver';
import slash from 'slash';

import consoleFactory, { setConsoleEnvData } from '@lib/console';
import { addLocalIpAddress } from '@lib/host/isIpAddressLocal';
import { parseTxDevEnv, TxDevEnvType } from '@shared/txDevEnv';
import { Overwrite } from 'utility-types';
import fatalError from '@lib/fatalError';
import { checkDeprecatedConvars } from './boot/checkDeprecatedConvars';
import { getRuntimeInfo } from './boot/getRuntimeInfo';
import { getHostVars } from './boot/getHostVars';
import consts from '@shared/consts';
import chalk from 'chalk';

const console = consoleFactory();


/**
 * MARK: HELPERS
 */
const cleanPath = (x: string) => slash(path.normalize(x));


/**
 * MARK: DEV ENV
 */
type TxDevEnvEnabledType = Overwrite<TxDevEnvType, {
    ENABLED: true;
    SRC_PATH: string, //required in core/webserver, core/getReactIndex.ts
    VITE_URL: string, //required in core/getReactIndex.ts
}>;
type TxDevEnvDisabledType = Overwrite<TxDevEnvType, {
    ENABLED: false;
    SRC_PATH: undefined;
    VITE_URL: undefined;
}>;
let _txDevEnv: TxDevEnvEnabledType | TxDevEnvDisabledType;
const devVars = parseTxDevEnv();
if (devVars.ENABLED) {
    console.debug('Starting txAdmin in DEV mode.');
    if (!devVars.SRC_PATH || !devVars.VITE_URL) {
        fatalError.GlobalData(8, 'Missing `TXDEV_VITE_URL` and/or `TXDEV_SRC_PATH` env variables.');
    }
    _txDevEnv = devVars as TxDevEnvEnabledType;
} else {
    _txDevEnv = {
        ...devVars,
        SRC_PATH: undefined,
        VITE_URL: undefined,
    } as TxDevEnvDisabledType;
}

//Setting verbose mode as early as possible
console.setVerbose(_txDevEnv.VERBOSE);

//DEBUG Temporary extra-verbosity
//FIXME:NEXT:UPDATE: remove
const debugRuntime = Boolean(process.env?.TXDEV_DEBUG_RUNTIME);
if (debugRuntime) {
    console.dir({
        process: {
            argv: process.argv,
            execArgv: process.execArgv,
            argv0: process.argv0,
            cwd: process.cwd(),
        },
        NodeVersion: process.versions?.node ?? undefined,
        BunVersion: process.versions?.bun ?? undefined,
        __dirname: __dirname ?? undefined,
        'import.meta.dir': (globalThis as any)?.import?.meta?.dir ?? undefined,
    }, { title: 'RUNTIME INIT' });
}


/**
 * MARK: RUNTIME
 */

//Check OS
const osType = os.type();
let _isWindows = false;
if (osType === 'Windows_NT') {
    _isWindows = true;
} else if (osType === 'Linux') {
    _isWindows = false;
} else {
    fatalError.GlobalData(0, `OS type not supported: ${osType}`);
}
const isWindows = _isWindows;


//Get runtime info (paths, versions, etc)
const runtimeInfo = getRuntimeInfo(isWindows);
const {
    runtime,
    runtimeVersionTag,
    txaResourceName,
    fxsBinaryPath,
    fxsIsGen9,
    fxsVersionInfo,
} = runtimeInfo;
const fxsVersion = fxsVersionInfo.build;
const txaPath = cleanPath(runtimeInfo.txaPath);
const fxsPath = cleanPath(runtimeInfo.fxsPath);

//DEBUG Temporary extra-verbosity
//FIXME:NEXT:UPDATE: remove
if (debugRuntime) {
    console.dir(runtimeInfo, { title: 'RUNTIME INFO' });
}

//Validate txaPath is a child of fxsPath
const txaToFxsRelative = path.relative(fxsPath, txaPath);
if (!txaToFxsRelative || path.isAbsolute(txaToFxsRelative) || txaToFxsRelative.startsWith('..')) {
    fatalError.GlobalData(11, [
        'The txAdmin resource is not located inside the target FXServer installation.',
        'This usually means `--fxspath` points to the wrong artifact folder.',
        ['txAdmin path', txaPath],
        ['FXServer path', fxsPath],
    ]);
}


//Check for deprecated convars
checkDeprecatedConvars(fxsIsGen9);


//Getting fxserver version
//4380 = GetVehicleType was exposed server-side
//4548 = more or less when node v16 was added
//4574 = add missing PRINT_STRUCTURED_TRACE declaration
//4574 = add resource field to PRINT_STRUCTURED_TRACE
//5894 = CREATE_VEHICLE_SERVER_SETTER
//6185 = added ScanResourceRoot (not yet in use)
//6508 = unhandledRejection is now handlable, we need this due to discord.js's bug
//8495 = changed prometheus::Histogram::BucketBoundaries
//9423 = feat(server): add more infos to playerDropped event
//9655 = Fixed ScanResourceRoot + latent events
//25770 = node 22 "golden version"
const minFxsVersion = 25770;
const minNodeVersion = '22.11.0';

// Invalid version: warn but continue with build=99999
if (!fxsVersionInfo.valid) {
    console.error('It looks like you are running a custom build of fxserver.');
    console.error('And because of that, there is no guarantee that txAdmin will work properly.');
    console.error(`Raw version string: ${fxsVersionInfo.raw ?? '(not available)'}`);
} else if (fxsVersionInfo.branch !== 'master') {
    console.warn(`You are running a custom branch of FXServer: ${fxsVersionInfo.branch}.`);
} else if (fxsVersion < minFxsVersion) {
    fatalError.GlobalData(2, [
        'This version of FXServer is too outdated and NOT compatible with txAdmin',
        ['Current FXServer version', fxsVersion],
        ['Minimum required version', minFxsVersion],
        'Please update your FXServer to a newer version.',
    ]);
}

// Check Node.js version for all runtimes
if (runtime === 'fxserver') {
    if (!semver.gte(process.versions.node, minNodeVersion)) {
        fatalError.GlobalData(10, [
            'This version of FXServer is running an outdated version of Node.js.',
            ['Node.js version', process.versions.node],
            ['Minimum required', minNodeVersion],
            'Please update your FXServer artifact to a newer version.',
        ]);
    }
} else {
    if (!semver.gte(process.versions.node, minNodeVersion)) {
        fatalError.GlobalData(10, [
            'This runtime\'s Node.js version is too old.',
            ['Runtime', runtimeVersionTag],
            ['Node.js version', process.versions.node],
            ['Minimum required', minNodeVersion],
            'Please update your Node.js or Bun to a newer version.',
        ]);
    }

    console.warn(console.DIVIDER);
    console.warn(`Running in experimental standalone mode with runtime: ${runtimeVersionTag}.`);
    console.warn(console.DIVIDER);
}

//Getting txAdmin version
//@ts-ignore esbuild will replace TX_RELEASE_VERSION with a string
const txaVersion = String(TX_RELEASE_VERSION);
if (!semver.valid(txaVersion)) {
    fatalError.GlobalData(3, [
        'txAdmin version not set or in the wrong format.',
        ['Detected version', txaVersion],
    ]);
}

//Check if server is inside WinRar's temp folder
if (isWindows && /Temp[\\/]+Rar\$/i.test(fxsPath)) {
    fatalError.GlobalData(12, [
        'It looks like you ran FXServer inside WinRAR without extracting it first.',
        'Please extract the server files to a proper folder before running it.',
        ['Server path', fxsPath.replace(/\\/g, '/').replace(/\/$/, '')],
    ]);
}


//Setting the variables in console without it having to importing from here (circular dependency)
setConsoleEnvData(
    txaVersion,
    txaPath,
    _txDevEnv.ENABLED,
);


/**
 * MARK: TXDATA & PROFILE 
 */
const hostVars = getHostVars();

//Setting data path
let hasCustomDataPath = false;
let dataPath = cleanPath(path.join(
    fxsPath,
    isWindows ? '..' : '../../../',
    'txData'
));
if (hostVars.DATA_PATH) {
    hasCustomDataPath = true;
    dataPath = cleanPath(hostVars.DATA_PATH);
}

//Check paths for non-ASCII characters
//NOTE: Non-ASCII in one of those paths (don't know which) will make NodeJS crash due to a bug in v8 (or something)
//      when running localization methods like Date.toLocaleString().
//      There was also an issue with the slash() lib and with the +exec on FXServer
const nonASCIIRegex = /[^\x00-\x80]+/g;
const colorNonAscii = (x: string) => chalk.black.bgGreenBright(
    x.replaceAll(nonASCIIRegex, (m) => chalk.bgRedBright(m))
);
if (nonASCIIRegex.test(fxsPath) || nonASCIIRegex.test(dataPath)) {
    fatalError.GlobalData(7, [
        'Due to environmental restrictions, your paths CANNOT contain non-ASCII characters.',
        'Example of non-ASCII characters: çâýå, ρέθ, ñäé, ēļæ, глж, เซิร์, 警告.',
        'Please make sure FXServer is not in a path contaning those characters.',
        isWindows && `Please consider moving the artifact to \`C:/fivemserver/${fxsVersion}/\`.`,
        'FXServer path: ' + colorNonAscii(fxsPath),
        'txData path: ' + colorNonAscii(dataPath),
    ]);
}

//Profile - TODO: remove when txData structure changes
const profileName = 'default';
const profilePath = cleanPath(path.join(dataPath, profileName));


/**
 * MARK: NETWORKING
 */

//No default, no convar cfg
const txaUrl = hostVars.TXA_URL;

//txAdmin port
const txaPort = hostVars.TXA_PORT ?? 40120;

//fxserver port
const fxsPort = hostVars.FXS_PORT;

//Forced interface
const netInterface = hostVars.INTERFACE;
if (netInterface) {
    addLocalIpAddress(netInterface);
}


/**
 * MARK: GENERAL
 */
const forceGameName = hostVars.GAME_NAME;
const hostApiToken = hostVars.API_TOKEN;

const forceMaxClients = hostVars.MAX_SLOTS;

const forceQuietMode = hostVars.QUIET_MODE ?? false;


/**
 * MARK: PROVIDER
 */
const providerName = hostVars.PROVIDER_NAME;
const providerLogo = hostVars.PROVIDER_LOGO;


/**
 * MARK: DEFAULTS
 */
const defaultDbHost = hostVars.DEFAULT_DBHOST;
const defaultDbPort = hostVars.DEFAULT_DBPORT;
const defaultDbUser = hostVars.DEFAULT_DBUSER;
const defaultDbPass = hostVars.DEFAULT_DBPASS;
const defaultDbName = hostVars.DEFAULT_DBNAME;

//Default Master Account
type DefaultMasterAccount = {
    username: string;
    fivemId?: string;
    password?: string;
} | {
    username: string;
    password: string;
} | undefined;
let defaultMasterAccount: DefaultMasterAccount;
const bcryptRegex = /^\$2[aby]\$[0-9]{2}\$[A-Za-z0-9./]{53}$/;
if (hostVars.DEFAULT_ACCOUNT) {
    let [username, fivemId, password] = hostVars.DEFAULT_ACCOUNT.split(':') as (string | undefined)[];
    if (username === '') username = undefined;
    if (fivemId === '') fivemId = undefined;
    if (password === '') password = undefined;

    const errArr: [string, any][] = [
        ['Username', username],
        ['FiveM ID', fivemId],
        ['Password', password],
    ];
    if (!username || !consts.regexValidFivemUsername.test(username)) {
        fatalError.GlobalData(21, [
            'Invalid default account username.',
            'It should be a valid FiveM username.',
            ...errArr,
        ]);
    }
    if (fivemId && !consts.validIdentifierParts.fivem.test(fivemId)) {
        fatalError.GlobalData(22, [
            'Invalid default account FiveM ID.',
            'It should match the number in the fivem:0000000 game identifier.',
            ...errArr,
        ]);
    }
    if (password && !bcryptRegex.test(password)) {
        fatalError.GlobalData(23, [
            'Invalid default account password.',
            'Expected bcrypt hash.',
            ...errArr,
        ]);
    }
    if (!fivemId && !password) {
        fatalError.GlobalData(24, [
            'Invalid default account.',
            'Expected at least the FiveM ID or password to be present.',
            ...errArr,
        ]);
    }
    defaultMasterAccount = {
        username,
        fivemId,
        password,
    };
}

//Default cfx key
const defaultCfxKey = hostVars.DEFAULT_CFXKEY;


/**
 * MARK: FINAL SETUP
 */
const isPterodactyl = !isWindows && process.env?.TXADMIN_ENABLE === '1';
const isZapHosting = providerName === 'ZAP-Hosting';
const setConsoleTitle = !(isPterodactyl || isZapHosting || providerName); //assume not a terminal


//FXServer Display Version
let fxsVersionTag = fxsVersion.toString();
if (fxsVersionInfo.branch === 'early-access') {
    fxsVersionTag += '-ea';
} else if (fxsVersionInfo.branch && fxsVersionInfo.branch !== 'master') {
    fxsVersionTag += '-ft';
}

let providerTag = '';
const partnerPrefixes = {
    'gportal': 'GPor',
    'nitrado': 'Nitr',
    'nodecraft': 'NoCr',
    'shockbyte': 'ShBy',
    'xrealm': 'XRea',
    'zaphosting': 'ZapH',
} as { [key: string]: string };
if (providerName) {
    const cleanName = providerName.toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (cleanName in partnerPrefixes) {
        providerTag = partnerPrefixes[cleanName];
    }
}

//FIXME: this should be part of the runtime tag, not fxserver version tag
if (providerTag) {
    fxsVersionTag += `/${providerTag}`;
} else if (isPterodactyl) {
    fxsVersionTag += '/Ptero';
} else if (isWindows) {
    fxsVersionTag += '/Win';
} else {
    fxsVersionTag += '/Lin';
}


/**
 * MARK: Exports
 */
export const txDevEnv = Object.freeze(_txDevEnv);

export const txEnv = Object.freeze({
    //Calculated
    isWindows,
    setConsoleTitle,

    //TODO: remove, used only in diagnostics (HB Data + page)
    isPterodactyl,
    isZapHosting, //NOTE: This one is also used in authLogic to disable src check

    //Natives
    runtime,

    fxsVersion,
    fxsVersionTag,
    fxsIsGen9,
    fxsPath,
    fxsBinaryPath,

    txaVersion,
    txaPath,
    txaResourceName,

    //ConVar
    profileName, //TODO: remove after profile structure changes
    profilePath, //TODO: replace by profileSubPath in most places
    profileSubPath: (...parts: string[]) => path.join(profilePath, ...parts),
});

export const txHostConfig = Object.freeze({
    //General
    dataPath,
    dataSubPath: (...parts: string[]) => path.join(dataPath, ...parts),
    hasCustomDataPath,
    forceGameName,
    forceMaxClients,
    forceQuietMode,
    hostApiToken,

    //Networking
    txaUrl,
    txaPort,
    fxsPort,
    netInterface,

    //Provider
    providerName,
    providerLogo,
    sourceName: providerName ?? 'Host Config',

    //Defaults
    defaults: {
        account: defaultMasterAccount,
        cfxKey: defaultCfxKey,
        dbHost: defaultDbHost,
        dbPort: defaultDbPort,
        dbUser: defaultDbUser,
        dbPass: defaultDbPass,
        dbName: defaultDbName,
    },
});


//DEBUG
// console.dir(txEnv, { compact: true });
// console.dir(txDevEnv, { compact: true });
// console.dir(txHostConfig, { compact: true });
