import os from 'node:os';
import fsp from 'node:fs/promises';
import path from 'node:path';
import slash from 'slash';

import consoleFactory, { setConsoleEnvData } from '@lib/console';
import { addLocalIpAddress } from '@lib/host/isIpAddressLocal';
import { parseFxserverVersion } from '@lib/fxserver/fxsVersionParser';
import { parseTxDevEnv, TxDevEnvType } from '@shared/txDevEnv';
import { Overwrite } from 'utility-types';
import fatalError from '@lib/fatalError';
import { getNativeVars } from './boot/getNativeVars';
import { getHostVars, hostEnvVarSchemas } from './boot/getHostVars';
import { getZapVars } from './boot/getZapVars';
import { z, ZodSchema } from 'zod';
import { fromZodError } from 'zod-validation-error';
import defaultAds from '../dynamicAds2.json';
import consts from '@shared/consts';
const console = consoleFactory();


/**
 * MARK: GETTING VARIABLES
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
    fatalError.GlobalData(0, `OS type not supported: ${osTypeVar}`);
}

//Simple env vars
const isPterodactyl = !isWindows && process.env?.TXADMIN_ENABLE === '1';
const ignoreDeprecatedConfigs = process.env?.TXHOST_IGNORE_DEPRECATED_CONFIGS === 'true';

//Getters
const nativeVars = getNativeVars(ignoreDeprecatedConfigs);
const hostVars = getHostVars();
const devVars = parseTxDevEnv();


/**
 * MARK: HELPERS
 */
const cleanPath = (x: string) => slash(path.normalize(x));
const handleMultiVar = <T extends ZodSchema>(
    name: string,
    schema: T,
    procenv: z.infer<T> | undefined,
    zapcfg: string | number | undefined,
    convar: any,
): z.infer<T> | undefined => {
    const alt = zapcfg ?? convar;
    if (alt === undefined) {
        return procenv;
    }
    const whichAlt = zapcfg !== undefined ? 'txAdminZapConfig.json' : 'ConVar';
    if (procenv !== undefined) {
        console.warn(`WARNING: Both the environment variable 'TXHOST_${name}' and the ${whichAlt} equivalent are set. The environment variable will be prioritized.`);
        return procenv;
    }
    const parsed = schema.safeParse(alt);
    if (!parsed.success) {
        fatalError.GlobalData(20, [
            `Invalid value for the TXHOST_${name}-equivalent config in ${whichAlt}.`,
            ['Value', alt],
            'For more information: https://aka.cfx.re/txadmin-host-config',
        ], fromZodError(parsed.error, { prefix: null }));
    }
    return parsed.data;
}


/**
 * MARK: CHECK HOST VARS
 */
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
const minFxsVersion = 5894;
const fxsVerParsed = parseFxserverVersion(nativeVars.fxsVersion);
const fxsVersion = fxsVerParsed.valid ? fxsVerParsed.build : 99999;
if (!fxsVerParsed.valid) {
    console.error('It looks like you are running a custom build of fxserver.');
    console.error('And because of that, there is no guarantee that txAdmin will work properly.');
    console.error(`Convar: ${nativeVars.fxsVersion}`);
    console.error(`Parsed Build: ${fxsVerParsed.build}`);
    console.error(`Parsed Branch: ${fxsVerParsed.branch}`);
    console.error(`Parsed Platform: ${fxsVerParsed.platform}`);
} else if (fxsVerParsed.build < minFxsVersion) {
    fatalError.GlobalData(2, [
        'This version of FXServer is too outdated and NOT compatible with txAdmin',
        ['Current FXServer version', fxsVerParsed.build.toString()],
        ['Minimum required version', minFxsVersion.toString()],
        'Please update your FXServer to a newer version.',
    ]);
} else if (fxsVerParsed.branch !== 'master') {
    console.warn(`You are running a custom branch of FXServer: ${fxsVerParsed.branch}`);
}

//Getting txAdmin version
if (!nativeVars.txaResourceVersion) {
    fatalError.GlobalData(3, [
        'txAdmin version not set or in the wrong format.',
        ['Detected version', nativeVars.txaResourceVersion],
    ]);
}
const txaVersion = nativeVars.txaResourceVersion;

//Get txAdmin Resource Path
if (!nativeVars.txaResourcePath) {
    fatalError.GlobalData(4, [
        'Could not resolve txAdmin resource path.',
        ['Convar', nativeVars.txaResourcePath],
    ]);
}
const txAdminResourcePath = cleanPath(nativeVars.txaResourcePath);

//Get citizen Root
if (!nativeVars.fxsCitizenRoot) {
    fatalError.GlobalData(5, [
        'citizen_root convar not set',
        ['Convar', nativeVars.fxsCitizenRoot],
    ]);
}
const fxServerPath = cleanPath(nativeVars.fxsCitizenRoot as string);

//Check if server is inside WinRar's temp folder
if (isWindows && /Temp[\\/]+Rar\$/i.test(fxServerPath)) {
    fatalError.GlobalData(12, [
        'It looks like you ran FXServer inside WinRAR without extracting it first.',
        'Please extract the server files to a proper folder before running it.',
        ['Server path', fxServerPath.replace(/\\/g, '/').replace(/\/$/, '')],
    ]);
}


/**
 * MARK: TXDATA & PROFILE 
 */
//Setting data path
const dataPathVar = handleMultiVar(
    'DATA_PATH',
    hostEnvVarSchemas.DATA_PATH,
    hostVars.DATA_PATH,
    undefined,
    nativeVars.txDataPath,
);
const defaultDataPath = path.join(
    fxServerPath,
    isWindows ? '..' : '../../../',
    'txData'
);
const dataPath = cleanPath(dataPathVar ?? defaultDataPath);

//Check paths for non-ASCII characters
//NOTE: Non-ASCII in one of those paths (don't know which) will make NodeJS crash due to a bug in v8 (or something)
//      when running localization methods like Date.toLocaleString().
//      There was also an issue with the slash() lib and with the +exec on FXServer
const nonASCIIRegex = /[^\x00-\x80]+/;
if (nonASCIIRegex.test(fxServerPath) || nonASCIIRegex.test(dataPath)) {
    fatalError.GlobalData(7, [
        'Due to environmental restrictions, your paths CANNOT contain non-ASCII characters.',
        'Example of non-ASCII characters: çâýå, ρέθ, ñäé, ēļæ, глж, เซิร์, 警告.',
        'Please make sure FXServer is not in a path contaning those characters.',
        `If on windows, we suggest you moving the artifact to "C:/fivemserver/${fxsVersion}/".`,
        ['FXServer path', fxServerPath],
        ['txData path', dataPath],
    ]);
}

//Profile - not available as env var
let profileVar = nativeVars.txAdminProfile;
if (profileVar) {
    profileVar = profileVar.replace(/[^a-z0-9._-]/gi, '');
    if (profileVar.endsWith('.base')) {
        fatalError.GlobalData(13, [
            ['Invalid server profile name', profileVar],
            'Profile names cannot end with ".base".',
            'It looks like you are trying to point to a server folder instead of a profile.',
        ]);
    }
    if (!profileVar.length) {
        fatalError.GlobalData(14, [
            'Invalid server profile name.',
            'If you are using Google Translator on the instructions page,',
            'make sure there are no additional spaces in your command.',
        ]);
    }
}
const profile = profileVar ?? 'default';
const profilePath = cleanPath(path.join(dataPath, profile));


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

if (devVars.ENABLED) {
    console.debug('Starting txAdmin in DEV mode.');
    if (!devVars.SRC_PATH || !devVars.VITE_URL) {
        fatalError.GlobalData(8, 'Missing TXDEV_VITE_URL and/or TXDEV_SRC_PATH env variables.');
    }
    _txDevEnv = devVars as TxDevEnvEnabledType;
} else {
    _txDevEnv = {
        ...devVars,
        SRC_PATH: undefined,
        VITE_URL: undefined,
    } as TxDevEnvDisabledType;
}


/**
 * MARK: ZAP & NETWORKING
 */
let isZapHosting = false;
let zapVars: ReturnType<typeof getZapVars> | undefined;
if (!ignoreDeprecatedConfigs) {
    const zapCfgFilePath = path.join(dataPath, 'txAdminZapConfig.json');
    try {
        zapVars = getZapVars(zapCfgFilePath);
        isZapHosting = !!zapVars && !isPterodactyl;
        if (!_txDevEnv.ENABLED) fsp.unlink(zapCfgFilePath).catch(() => { });
    } catch (error) {
        fatalError.GlobalData(9, 'Failed to load with ZAP-Hosting configuration.', error);
    }
}

//txAdmin port
const txAdminPort = handleMultiVar(
    'TXA_PORT',
    hostEnvVarSchemas.TXA_PORT,
    hostVars.TXA_PORT,
    zapVars?.txAdminPort,
    nativeVars.txAdminPort,
) ?? 40120;

//fxserver port
const forceFXServerPort = handleMultiVar(
    'FXS_PORT',
    hostEnvVarSchemas.FXS_PORT,
    hostVars.FXS_PORT,
    zapVars?.forceFXServerPort,
    undefined,
);

//Forced interface
const forceInterface = handleMultiVar(
    'INTERFACE',
    hostEnvVarSchemas.INTERFACE,
    hostVars.INTERFACE,
    zapVars?.forceInterface,
    nativeVars.txAdminInterface,
);
if (forceInterface) {
    addLocalIpAddress(forceInterface);
}


/**
 * MARK: PROVIDER
 */
const providerName = handleMultiVar(
    'PROVIDER_NAME',
    hostEnvVarSchemas.PROVIDER_NAME,
    hostVars.PROVIDER_NAME,
    zapVars?.providerName,
    undefined,
) ?? 'Host Config';
const providerLogo = handleMultiVar(
    'PROVIDER_LOGO',
    hostEnvVarSchemas.PROVIDER_LOGO,
    hostVars.PROVIDER_LOGO,
    zapVars?.loginPageLogo,
    undefined,
);

const maxClients = handleMultiVar(
    'MAX_SLOTS',
    hostEnvVarSchemas.MAX_SLOTS,
    hostVars.MAX_SLOTS,
    zapVars?.deployerDefaults?.maxClients,
    undefined,
);


/**
 * MARK: DEFAULTS
 */
const defaultDbHost = handleMultiVar(
    'DB_HOST',
    hostEnvVarSchemas.DB_HOST,
    hostVars.DB_HOST,
    zapVars?.deployerDefaults?.mysqlHost,
    undefined,
);
const defaultDbPort = handleMultiVar(
    'DB_PORT',
    hostEnvVarSchemas.DB_PORT,
    hostVars.DB_PORT,
    zapVars?.deployerDefaults?.mysqlPort,
    undefined,
);
const defaultDbUser = handleMultiVar(
    'DB_USER',
    hostEnvVarSchemas.DB_USER,
    hostVars.DB_USER,
    zapVars?.deployerDefaults?.mysqlUser,
    undefined,
);
const defaultDbPass = handleMultiVar(
    'DB_PASS',
    hostEnvVarSchemas.DB_PASS,
    hostVars.DB_PASS,
    zapVars?.deployerDefaults?.mysqlPassword,
    undefined,
);
const defaultDbName = handleMultiVar(
    'DB_NAME',
    hostEnvVarSchemas.DB_NAME,
    hostVars.DB_NAME,
    zapVars?.deployerDefaults?.mysqlDatabase,
    undefined,
);

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
} else if (zapVars?.defaultMasterAccount) {
    const username = zapVars.defaultMasterAccount?.name;
    const password = zapVars.defaultMasterAccount?.password_hash;
    if (!consts.regexValidFivemUsername.test(username)) {
        fatalError.GlobalData(25, [
            'Invalid default account username.',
            'It should be a valid FiveM username.',
            ['Username', username],
        ]);
    }
    if (!bcryptRegex.test(password)) {
        fatalError.GlobalData(26, [
            'Invalid default account password.',
            'Expected bcrypt hash.',
            ['Hash', password],
        ]);
    }
    defaultMasterAccount = {
        username: username,
        password: password,
    };
}

//Default cfx key
const defaultCfxKey = handleMultiVar(
    'DEFAULT_CFXKEY',
    hostEnvVarSchemas.DEFAULT_CFXKEY,
    hostVars.DEFAULT_CFXKEY,
    zapVars?.deployerDefaults?.license,
    undefined,
);


/**
 * MARK: FINAL SETUP
 */
//Setting the variables in console without it having to importing from here (cyclical dependency)
setConsoleEnvData(
    txaVersion,
    txAdminResourcePath,
    _txDevEnv.ENABLED,
    _txDevEnv.VERBOSE
);

if (ignoreDeprecatedConfigs) {
    console.verbose.debug('TXHOST_IGNORE_DEPRECATED_CONFIGS is set to true. Ignoring deprecated configs.');
}

//Quick config to disable ads
const displayAds = process.env?.TXHOST_TMPHIDEADS !== 'true' || isPterodactyl || isZapHosting;
const adSchema = z.object({
    img: z.string(),
    url: z.string(),
}).nullable();
const adsDataSchema = z.object({
    login: adSchema,
    main: adSchema,
});
let adsData: z.infer<typeof adsDataSchema> = {
    login: null,
    main: null,
};
if (displayAds) {
    try {
        adsData = adsDataSchema.parse(defaultAds);
    } catch (error) {
        console.error('Failed to load ads data.', error);
    }
}

//FXServer Display Version
let fxsVersionDisplay = fxsVersion.toString();
if (fxsVerParsed.branch && fxsVerParsed.branch !== 'master') {
    fxsVersionDisplay += '-ft';
}
if (isZapHosting) {
    fxsVersionDisplay += '/ZAP';
} else if (isPterodactyl) {
    fxsVersionDisplay += '/Ptero';
} else if (isWindows && fxsVerParsed.platform === 'windows') {
    fxsVersionDisplay += '/Win';
} else if (!isWindows && fxsVerParsed.platform === 'linux') {
    fxsVersionDisplay += '/Lin';
} else {
    fxsVersionDisplay += '/Unk';
}


/**
 * MARK: Exports
 */
export const txDevEnv = Object.freeze(_txDevEnv);

export const txEnv = Object.freeze({
    osType,
    isWindows,
    fxsVersionDisplay,
    fxsVersion,
    txaVersion,
    txAdminResourcePath,
    fxServerPath,
    dataPath, //convar txDataPath
    profile, //convar serverProfile
    profilePath,
});

export const convars = Object.freeze({
    isPterodactyl,
    isZapHosting,
    forceInterface, //convar txAdminInterface, or zap config
    forceFXServerPort,
    txAdminPort, //convar txAdminPort, or zap config
    providerName, //not being used
    providerLogo, //not being used
    displayAds,
    adsData,
    defaultMasterAccount,
    deployerDefaults: {
        license: defaultCfxKey,
        maxClients: maxClients,
        mysqlHost: defaultDbHost,
        mysqlPort: defaultDbPort,
        mysqlUser: defaultDbUser,
        mysqlPassword: defaultDbPass,
        mysqlDatabase: defaultDbName,
    },
});
