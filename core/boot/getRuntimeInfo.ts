import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import fatalError from '@lib/fatalError';
import { parseFxserverVersion } from '@lib/fxserver/fxsVersionParser';
import { readFxsBinVersion } from '@lib/fxserver/fxsBinReader';


//MARK: Types
type RuntimeName = 'fxserver' | 'node' | 'bun';

export type FxsVersionInfo = {
    valid: boolean;
    branch: string | null;
    build: number;  // 99999 for invalid/custom builds
    raw: string | null;
};

export type RuntimeInfo = {
    isWindows: boolean;
    runtime: RuntimeName;
    runtimeNodeVersion: string;
    runtimeVersionTag: string;
    txaPath: string;
    txaResourceName: string;
    fxsPath: string;
    fxsVersionInfo: FxsVersionInfo;
};


//MARK: Constants
//FIXME: define the correct capitalization
const VALID_TXA_RES_NAMES = ['txAdmin', 'txadmin', 'monitor'] as const;


//MARK: Helpers
/**
 * Detects the OS type. Only Windows and Linux are supported.
 */
const detectOs = (): boolean => {
    const osType = os.type();
    if (osType === 'Windows_NT') {
        return true;
    } else if (osType === 'Linux') {
        return false;
    }
    fatalError.GlobalData(0, `OS type not supported: ${osType}`);
};

/**
 * Detects the current runtime and builds a version tag for display.
 * Priority: FXServer binary -> Bun global -> Node.js (fallback)
 * 
 * The version tag is built here because it depends on runtime type:
 * - fxserver: uses fxs build number (provided later, so we return a builder)
 * - bun: uses Bun.version
 * - node: uses process.versions.node
 */
const detectRuntime = (): { runtime: RuntimeName; buildVersionTag: (fxsBuild: number) => string } => {
    //FIXME: this builder stuff is stupid.
    const argv0Base = path.basename(process.argv0);
    if (argv0Base === 'FXServer' || argv0Base === 'FXServer.exe') {
        return {
            runtime: 'fxserver',
            buildVersionTag: (fxsBuild) => `fxs/${fxsBuild}`,
        };
    }
    if (typeof Bun !== 'undefined') {
        return {
            runtime: 'bun',
            buildVersionTag: () => `bun/${Bun!.version}`,
        };
    }
    return {
        runtime: 'node',
        buildVersionTag: () => `node/${process.versions.node}`,
    };
};

/**
 * Extracts and validates txaPath and txaResourceName from __dirname.
 * 
 * Edge cases handled:
 * - Cross-platform path formats (Windows, Linux, MSYS)
 * - Path normalization for consistent separators
 * - Valid resource names: txAdmin, txadmin, monitor
 * - Path structure: must end in system_resources/{resourceName}/core
 */
const extractTxaPaths = () => {
    const normalizedDirname = path.normalize(__dirname);
    let txaResourceName: string | undefined;

    try {
        if (!path.isAbsolute(normalizedDirname)) {
            throw new Error('__dirname must be an absolute path');
        }

        const dirnameParts = normalizedDirname.split(path.sep).filter(Boolean);

        // Validate path structure: .../system_resources/{resourceName}/core
        if (dirnameParts.at(-1) !== 'core') {
            throw new Error('Invalid dirname: last part must be "core"');
        }

        txaResourceName = dirnameParts.at(-2);
        if (!txaResourceName || !VALID_TXA_RES_NAMES.includes(txaResourceName as typeof VALID_TXA_RES_NAMES[number])) {
            throw new Error(`Invalid resource name, expected 'monitor' or 'txadmin'`);
        }

        if (dirnameParts.at(-3) !== 'system_resources') {
            throw new Error(`Invalid dirname: parts.at(-3) must be 'system_resources', got '${dirnameParts.at(-3)}'`);
        }
    } catch (error) {
        fatalError.GlobalData(14, [
            'Could not determine txAdmin resource path.',
            (error as Error).message,
            ['_dirname', normalizedDirname],
            'If you are not running txAdmin from the default FXServer installation,',
            'make sure to read the documentation on how to setup txAdmin.'
        ]);
    }

    // txaPath is the resource folder (without /core)
    const txaPath = path.dirname(normalizedDirname);

    return { txaPath, txaResourceName };
};

/**
 * Validates that a path is a valid FXServer installation folder.
 * Checks for absolute path and existence of FXServer binary.
 */
const isValidFxsPath = (fxsPath: string, isWindows: boolean) => {
    if (!path.isAbsolute(fxsPath)) {
        return false;
    }
    const binaryName = isWindows ? 'FXServer.exe' : 'FXServer';
    const binaryPath = path.join(fxsPath, binaryName);
    return fs.existsSync(binaryPath);
};

/**
 * Resolves the FXServer installation path using multiple sources in priority order:
 * 1. CLI argument --fxspath
 * 2. dirname(argv[0]) if running from FXServer binary
 * 3. Relative path from __dirname (../../../../)
 */
const resolveFxsPath = (isWindows: boolean) => {
    // 1. Try CLI argument --fxspath
    const fxspathArgIndex = process.argv.indexOf('--fxspath');
    if (fxspathArgIndex !== -1 && process.argv[fxspathArgIndex + 1]) {
        const cliPath = path.normalize(process.argv[fxspathArgIndex + 1]);
        if (isValidFxsPath(cliPath, isWindows)) {
            return cliPath;
        }
    }

    // 2. Try dirname(argv[0]) if basename is FXServer/FXServer.exe
    const argv0 = path.normalize(process.argv0);
    const execName = path.basename(argv0);
    if (execName === 'FXServer' || execName === 'FXServer.exe') {
        const argv0Dir = path.dirname(argv0);
        if (isValidFxsPath(argv0Dir, isWindows)) {
            return argv0Dir;
        }
    }

    // 3. Try relative path from __dirname (../../../../)
    const relativeFxsPath = path.normalize(path.join(__dirname, '../../../../'));
    if (isValidFxsPath(relativeFxsPath, isWindows)) {
        return relativeFxsPath;
    }

    // No valid path found
    fatalError.GlobalData(9, [
        'Could not resolve FXServer installation path.',
        'Tried the following sources:',
        ['1. CLI argument --fxspath', fxspathArgIndex !== -1 ? process.argv[fxspathArgIndex + 1] : '(not provided)'],
        ['2. Process argv[0]', argv0],
        ['3. Relative path', relativeFxsPath],
        'Please provide a valid `--fxspath` argument or ensure the directory structure is correct.',
    ]);
};

/**
 * Resolves the FXServer version info.
 * 1. Try reading from binary metadata
 * 2. If fxserver runtime, try GetConvar fallback
 * 3. Return invalid result with build=99999 if nothing works (fxserver runtime only)
 */
const resolveFxsVersion = (runtime: RuntimeName, fxsPath: string, isWindows: boolean): FxsVersionInfo => {
    //FIXME:  check this entire version logic.
    // Try reading from binary metadata first
    console.verbose.debug('Checking FXServer binary... ');
    const binVersion = readFxsBinVersion(fxsPath, isWindows);
    console.verbose.debug('FXServer detected: ', JSON.stringify({ branch: binVersion.branch, build: binVersion.build }));

    if (binVersion.valid) {
        return {
            valid: true,
            branch: binVersion.branch,
            build: binVersion.build,
            raw: binVersion.raw,
        };
    }

    // Fallback: GetConvar for fxserver runtime
    if (runtime === 'fxserver' && typeof GetConvar === 'function') {
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
        };
    }

    // Standalone mode: could not determine version
    fatalError.GlobalData(13, [
        'Could not determine FXServer version.',
        'Failed to read version from binary metadata.',
        'When running outside FXServer, you must use a compatible FXServer installation.',
        //FIXME: change message
    ]);
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
export const getRuntimeInfo = (): RuntimeInfo => {
    // Detect OS first (needed for path resolution)
    const isWindows = detectOs();

    // Detect runtime and get version tag builder
    const { runtime, buildVersionTag } = detectRuntime();
    const runtimeNodeVersion = process.versions.node;

    // Extract txAdmin paths (validates internally)
    const { txaPath, txaResourceName } = extractTxaPaths();

    // Resolve FXServer path (validates internally)
    const fxsPath = resolveFxsPath(isWindows);

    // Resolve FXServer version (validates internally for standalone mode)
    const fxsVersionInfo = resolveFxsVersion(runtime, fxsPath, isWindows);

    // Build version tag now that we have fxs build number
    const runtimeVersionTag = buildVersionTag(fxsVersionInfo.build);

    return {
        isWindows,
        runtime,
        runtimeNodeVersion,
        runtimeVersionTag,
        txaPath,
        txaResourceName,
        fxsPath,
        fxsVersionInfo,
    };
};
