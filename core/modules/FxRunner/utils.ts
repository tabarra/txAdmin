import type { ChildProcessWithoutNullStreams } from "node:child_process";
import { Readable, Writable } from "node:stream";
import { convars, txEnv } from "@core/globalData";
import { redactStartupSecrets } from "@lib/misc";
import path from "path";


/**
 * Blackhole event logger
 */
let lastBlackHoleSpewTime = 0;
const blackHoleSpillMaxInterval = 5000;
export const childProcessEventBlackHole = (...args: any[]) => {
    const currentTime = Date.now();
    if (currentTime - lastBlackHoleSpewTime > blackHoleSpillMaxInterval) {
        //Let's call this "hawking radiation"
        console.verbose.error('ChildProcess unexpected event:');
        console.verbose.dir(args);
        lastBlackHoleSpewTime = currentTime;
    }
};


/**
 * Returns a tuple with the convar name and value, formatted for the server command line
 */
export const getMutableConvars = (isCmdLine = false) => {
    const checkPlayerJoin = txConfig.banlist.enabled || txConfig.whitelist.mode !== 'disabled';
    const convars: RawConvarSetTuple[] = [
        ['setr', 'locale', txConfig.general.language ?? 'en'],
        ['set', 'localeFile', txCore.translator.customLocalePath],
        ['set', 'serverName', txConfig.general.serverName ?? 'txAdmin'],
        ['set', 'checkPlayerJoin', checkPlayerJoin],
        ['set', 'menuAlignRight', txConfig.gameFeatures.menuAlignRight],
        ['set', 'menuPageKey', txConfig.gameFeatures.menuPageKey],
        ['set', 'playerModePtfx', txConfig.gameFeatures.playerModePtfx],
        ['set', 'hideAdminInPunishments', txConfig.gameFeatures.hideAdminInPunishments],
        ['set', 'hideAdminInMessages', txConfig.gameFeatures.hideAdminInMessages],
        ['set', 'hideDefaultAnnouncement', txConfig.gameFeatures.hideDefaultAnnouncement],
        ['set', 'hideDefaultDirectMessage', txConfig.gameFeatures.hideDefaultDirectMessage],
        ['set', 'hideDefaultWarning', txConfig.gameFeatures.hideDefaultWarning],
        ['set', 'hideDefaultScheduledRestartWarning', txConfig.gameFeatures.hideDefaultScheduledRestartWarning],

        // //NOTE: no auto update, maybe we shouldn't tie core and server verbosity anyways
        // ['setr', 'verbose', console.isVerbose],
    ];
    return convars.map((c) => polishConvarSetTuple(c, isCmdLine));
};

type RawConvarSetTuple = [setter: string, name: string, value: any];
type ConvarSetTuple = [setter: string, name: string, value: string];

const polishConvarSetTuple = ([setter, name, value]: RawConvarSetTuple, isCmdLine = false): ConvarSetTuple => {
    return [
        isCmdLine ? `+${setter}` : setter,
        'txAdmin-' + name,
        value.toString(),
    ];
}

export const mutableConvarConfigDependencies = [
    'general.*',
    'gameFeatures.*',
    'banlist.enabled',
    'whitelist.mode',
];


/**
 * Pre calculating HOST dependent spawn variables
 */
const txCoreEndpoint = convars.forceInterface
    ? `${convars.forceInterface}:${convars.txAdminPort}`
    : `127.0.0.1:${convars.txAdminPort}`;
let osSpawnVars: OsSpawnVars;
if (txEnv.isWindows) {
    osSpawnVars = {
        bin: `${txEnv.fxServerPath}/FXServer.exe`,
        args: [],
    };
} else {
    const alpinePath = path.resolve(txEnv.fxServerPath, '../../');
    osSpawnVars = {
        bin: `${alpinePath}/opt/cfx-server/ld-musl-x86_64.so.1`,
        args: [
            '--library-path', `${alpinePath}/usr/lib/v8/:${alpinePath}/lib/:${alpinePath}/usr/lib/`,
            '--',
            `${alpinePath}/opt/cfx-server/FXServer`,
            '+set', 'citizen_dir', `${alpinePath}/opt/cfx-server/citizen/`,
        ],
    };
}

type OsSpawnVars = {
    bin: string;
    args: string[];
}


/**
 * Returns the variables needed to spawn the server
 */
export const getFxSpawnVariables = (): FxSpawnVariables => {
    if (!txConfig.server.dataPath) throw new Error('Missing server data path');

    const cmdArgs = [
        ...osSpawnVars.args,
        getMutableConvars(true), //those are the ones that can change without restart
        txConfig.server.startupArgs,
        '+set', 'onesync', txConfig.server.onesync,
        '+sets', 'txAdmin-version', txEnv.txaVersion,
        '+setr', 'txAdmin-menuEnabled', txConfig.gameFeatures.menuEnabled,
        '+set', 'txAdmin-luaComHost', txCoreEndpoint,
        '+set', 'txAdmin-luaComToken', txCore.webServer.luaComToken,
        '+set', 'txAdminServerMode', 'true', //Can't change this one due to fxserver code compatibility
        '+exec', txConfig.server.cfgPath,
    ].flat(2).map(String);

    return {
        bin: osSpawnVars.bin,
        args: cmdArgs,
        serverName: txConfig.general.serverName,
        dataPath: txConfig.server.dataPath,
        cfgPath: txConfig.server.cfgPath,
    }
}

type FxSpawnVariables = OsSpawnVars & {
    dataPath: string;
    cfgPath: string;
    serverName: string;
}


/**
 * Print debug information about the spawn variables
 */
export const debugPrintSpawnVars = (fxSpawnVars: FxSpawnVariables) => {
    if (!console.verbose) return; //can't console.verbose.table

    console.debug('Spawn Bin:', fxSpawnVars.bin);
    const args = redactStartupSecrets(fxSpawnVars.args)
    console.debug('Spawn Args:');
    const argsTable = [];
    let currArgs: string[] | undefined;
    for (const arg of args) {
        if (arg.startsWith('+')) {
            if (currArgs) argsTable.push(currArgs);
            currArgs = [arg];
        } else {
            if (!currArgs) currArgs = [];
            currArgs.push(arg);
        }
    }
    if (currArgs) argsTable.push(currArgs);
    console.table(argsTable);
}


/**
 * Type guard for a valid child process
 */
export const isValidChildProcess = (p: any): p is ValidChildProcess => {
    if (!p) return false;
    if (typeof p.pid !== 'number') return false;
    if (!Array.isArray(p.stdio)) return false;
    if (p.stdio.length < 4) return false;
    if (!(p.stdio[3] instanceof Readable)) return false;
    return true;
};
export type ValidChildProcess = ChildProcessWithoutNullStreams & {
    pid: number;
    readonly stdio: [
        Writable,
        Readable,
        Readable,
        Readable,
        Readable | Writable | null | undefined, // extra
    ];
};
