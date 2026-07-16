import path from 'node:path';
import fatalError from '@lib/fatalError';
import { parseFxserverVersion } from '@lib/fxserver/fxsVersionParser';
import { readFxsGen8BinVersion } from '@lib/fxserver/fxsBinReader';


//MARK: Types
type RuntimeName = 'fxserver' | 'node' | 'bun';

export type FxsVersionInfo = {
    valid: boolean;
    branch: string | null;
    build: number;  // 99999 for invalid/custom builds
    raw: string | null;
};

export type RuntimeInfo = {
    runtime: RuntimeName;
    runtimeVersionTag: string;
    txaPath: string;
    txaResourceName: string;
    fxsPath: string;
    fxsBinaryPath: string;
    fxsIsGen9: boolean;
    fxsVersionInfo: FxsVersionInfo;
};


//MARK: Helpers
/**
 * Uses the GetConvar function to get the FXServer version.
 */
const getVersionFromConvar = (): FxsVersionInfo => {
    //Sanity check
    if (typeof GetConvar !== 'function') {
        throw new Error(`Expected GetConvar function to be available for FXServer Gen8.`);
    }

    const versionConvar = GetConvar('version', 'unknown');
    const parsed = parseFxserverVersion(versionConvar);
    if (parsed.valid) {
        return {
            valid: true,
            branch: parsed.branch,
            build: parsed.build,
            raw: versionConvar,
        };
    }

    // Return invalid with build=99999 for custom/dev builds so version checks pass
    return {
        valid: false,
        branch: null,
        build: 99999,
        raw: versionConvar,
    }
};


/**
 * Uses the process.argv to get the FXServer version.
 * 
 * Gen9 passes a single argv string like 
 * '--runtime-branch "early-access" --runtime-version "b50"'
 */
const getVersionFromArgs = (): FxsVersionInfo => {
    // cfx-server: 
    const raw = process.argv.find((arg) => arg.includes('--runtime-version')) ?? null;
    const branchMatch = raw?.match(/--runtime-branch\s+(?:"([^"]+)"|(\S+))/);
    const branch = branchMatch?.[1] ?? branchMatch?.[2] ?? null;
    const build = raw?.match(/--runtime-version\s+"?b(\d+)"?/)?.[1];
    return {
        valid: !!build,
        branch,
        build: build ? parseInt(build, 10) : 99999,
        raw,
    };
};


//MARK: Main
/**
 * Gathers all runtime information needed for the boot process.
 * This replaces the old getNativeVars() and extractServerPaths() functions.
 * 
 * All validations are performed inline - functions call fatalError directly on failure.
 * 
 * @returns RuntimeInfo object with all boot-time variables
 */
export const getRuntimeInfo = (isWindows: boolean): RuntimeInfo => {
    const binExt = isWindows ? '.exe' : '';

    //Get normalized paths
    const argv0 = path.normalize(process.argv0);
    const argv0Bin = path.basename(argv0);
    const argv0Dir = path.dirname(argv0);
    const dirname = path.normalize(__dirname);
    //FIXME: this does not work for bun/node, needs to use process.argv[0] which does not match process.argv0!
    if (!path.isAbsolute(argv0) || !path.isAbsolute(dirname)) {
        //FIXME: update number
        fatalError.GlobalData(99, [
            'Runtime path validation failed: expected absolute paths.',
            ['argv0', argv0],
            ['dirname', dirname],
        ]);
    }

    //If builtin or standalone
    let runtime: RuntimeName;
    let runtimeVersionTag: string;
    let fxsPath: string;
    let fxsBinaryPath: string;
    let fxsIsGen9: boolean;
    let fxsVersionInfo: FxsVersionInfo;
    let txaPath: string;
    let txaResourceName: string;
    if (argv0Bin === `FXServer${binExt}` || argv0Bin === `cfx-server${binExt}`) {
        runtime = 'fxserver';
        fxsBinaryPath = path.join(argv0Dir, argv0Bin);
        fxsPath = argv0Dir;

        let systemResourcesPath: string;
        if (argv0Bin === `FXServer${binExt}`) {
            fxsIsGen9 = false;
            fxsVersionInfo = getVersionFromConvar();
            runtimeVersionTag = `fxs/${fxsVersionInfo.build}`;
            systemResourcesPath = 'citizen/system_resources/';
            txaResourceName = 'monitor';
        } else {
            fxsIsGen9 = true;
            fxsVersionInfo = getVersionFromArgs();
            runtimeVersionTag = `cfxs/${fxsVersionInfo.build}`;
            systemResourcesPath = 'system_resources/';
            txaResourceName = 'txadmin';
        }

        //Sanity checking txAdmin path - assumes it's inside the FXServer installation
        txaPath = path.join(fxsPath, systemResourcesPath, txaResourceName);
        const expectedTxaPath = path.join(txaPath, 'core');
        if (dirname !== expectedTxaPath) {
            //FIXME: update number
            fatalError.GlobalData(99, [
                'Invalid txAdmin path.',
                'Expected: ', expectedTxaPath,
                'Got: ', dirname,
                'Please check your installation and try again.',
            ]);
        }

    } else {
        //FIXME: remove
        fatalError.GlobalData(99, 'Running txAdmin in standalone mode is not currently supported.');

        if (typeof Bun !== 'undefined') {
            runtime = 'bun';
            runtimeVersionTag = `bun/${Bun!.version}`;
            //FIXME: check the warning in ./core/boot/setupProcessHandlers.ts
        } else if (process.release?.name === 'node' && !('deno' in process.versions)) {
            runtime = 'node';
            runtimeVersionTag = `node/${process.versions.node}`;
            //FIXME: remove
            fatalError.GlobalData(99, 'The Bun runtime currently is not supported.');
        } else {
            //FIXME: update number
            fatalError.GlobalData(99, [
                'Unsupported runtime detected.',
                'txAdmin requires FXServer, cfx-server, Node.js, or Bun.',
                ['process.argv0', process.argv0],
                ['process.release', process.release?.name ?? '(none)'],
                ['process.versions', JSON.stringify(process.versions)],
            ]);
        }

        //TODO: resolve fxs or cfxs flag, then use readFxsGen8BinVersion
    }

    return {
        runtime,
        runtimeVersionTag,
        txaPath,
        txaResourceName,
        fxsPath,
        fxsBinaryPath,
        fxsIsGen9,
        fxsVersionInfo,
    };
};
