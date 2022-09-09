import fs from 'node:fs';
import path from 'node:path';
import child_process from 'node:child_process';
import chokidar from 'chokidar';
import debounce from 'lodash/debounce.js';
import esbuild from 'esbuild';

import { licenseBanner, getFxsPaths } from './scripts-utils.js';
const txLicenseBanner = licenseBanner();

//FIXME: probably better to use .env with deploypath, sv_licensekey, etc
import config from '../.deploy.config.js';

/**
 * Gets the pre-release expiration const to be defined by esbuild.
 * @returns false | timestamp
 */
const getPreReleaseExpiration = () => {
    if (process?.env?.TX_PRERELEASE_BUILD === 'true') {
        return new Date().setUTCHours(24 * config.preReleaseExpirationDays, 0, 0, 0);
    } else {
        return false;
    }
};


/**
 * Sync the files from local path to target path.
 * This function tried to remove the files before copying new ones,
 * therefore, first make sure the path is correct.
 * @param {String} targetPath
 * @param {String} eventName
 */
const copyStaticFiles = (targetPath, eventName) => {
    console.log(`[COPIER][${eventName}] Syncing ${targetPath}.`);
    for (const srcPath of config.copy) {
        const destPath = path.join(targetPath, srcPath);
        fs.rmSync(destPath, { recursive: true, force: true });
        fs.cpSync(srcPath, destPath, { recursive: true });
    }
};


/**
 * Class to handle the fxserver process running txadmin
 */
class txAdminRunner {
    constructor(fxServerRootPath, fxsBinPath) {
        this.config = config;
        this.fxServerRootPath = fxServerRootPath;
        this.fxsBinPath = fxsBinPath;
        this.fxChild = null;

        this.spawnVariables = {
            command: fxsBinPath,
            args: config.txAdminArgs ?? [],
        };
    }

    spawnServer() {
        //If the server is already alive
        if (this.fxChild !== null) {
            return console.error('[RUNNER] The server is already started.');
        }
        console.log('[RUNNER] spawning process.');

        //Starting server
        try {
            this.fxChild = child_process.spawn(
                this.spawnVariables.command,
                this.spawnVariables.args,
                {
                    // stdio: "inherit",
                    cwd: this.fxServerRootPath,
                    env: { ...process.env, TERM: 'xterm-256color', FORCE_COLOR: 3 },
                },
            );
        } catch (error) {
            console.error('[RUNNER] Failed to start FXServer with the following error:');
            console.dir(error);
            process.exit(1);
        }

        //Setting up stream handlers
        this.fxChild.stdout.setEncoding('utf8');
        this.fxChild.stdout.pipe(process.stdout);
        this.fxChild.stderr.pipe(process.stderr);

        //Setting up event handlers
        this.fxChild.on('close', (code) => {
            console.log('[RUNNER] FXServer Closed.');
        });
        this.fxChild.on('error', (err) => {
            console.log('[RUNNER] FXServer Errored:');
            console.dir(err);
        });
        this.fxChild.on('exit', () => {
            process.stdout.write('\n');
            console.log('[RUNNER] FXServer Exited.');
        });
    }

    killServer() {
        try {
            if (this.fxChild !== null) {
                console.log('[RUNNER] killing process.');
                this.fxChild.kill();
                this.fxChild = null;
            }
        } catch (error) {
            console.error(msg);
        }
    }
};


/**
 * Development task, it will copy the files to target fxserver, build+bundle core, and watch for changes.
 */
const runDevTask = () => {
    //Extract paths and validate them
    if (typeof config.fxserverPath !== 'string') {
        console.error('config.fxserverPath not configured.');
        process.exit(1);
    }
    let fxServerRootPath, fxsBinPath, monitorPath;
    try {
        ({ fxServerRootPath, fxsBinPath, monitorPath } = getFxsPaths(config.fxserverPath));
    } catch (error) {
        console.error('[BUILDER] Could not extract/validate the fxserver and monitor paths.');
        console.error(error);
        process.exit(1);
    }
    console.log(`[BUILDER] Starting txAdmin Dev Builder for ${fxServerRootPath}`);

    //Sync target path and start chokidar
    //We don't really care about the path, just remove everything and copy again
    copyStaticFiles(monitorPath, 'init');
    const debouncedCopier = debounce(copyStaticFiles, config.debouncerInterval);
    const watcher = chokidar.watch(config.copy, {
        // awaitWriteFinish: true,
        persistent: true,
        ignoreInitial: true,
    });
    watcher.on('add', () => { debouncedCopier(monitorPath, 'add'); });
    watcher.on('change', () => { debouncedCopier(monitorPath, 'change'); });
    watcher.on('unlink', () => { debouncedCopier(monitorPath, 'unlink'); });

    //Create txAdmin process runner
    const txInstance = new txAdminRunner(fxServerRootPath, fxsBinPath);

    //Transpile & bundle
    //NOTE: "result" is {errors[], warnings[], stop()}
    console.log('[BUILDER] Building core.');
    esbuild.build({
        entryPoints: ['./core'],
        bundle: true,
        outfile: path.join(monitorPath, 'core', 'index.js'),
        platform: 'node',
        target: 'node16',
        charset: 'utf8',
        define: {
            TX_PRERELEASE_BUILD_EXPIRATION: getPreReleaseExpiration(),
        },
        //no minify, no banner
        watch: {
            onRebuild(error, result) {
                if (error) {
                    console.log(`[BUILDER] Failed with errors.`);
                    txInstance.killServer();
                } else {
                    console.log('[BUILDER] Finished rebuild.');
                    txInstance.killServer();
                    txInstance.spawnServer();
                }
            },
        },
    }).then((result) => {
        console.log('[BUILDER] Finished initial build.');
        txInstance.spawnServer();
    }).catch((error) => {
        console.log('[BUILDER] Failed initial build.');
        console.log('[BUILDER] You need to fix the error and restart the builder script entirely');
    });
};


/**
 * Main publish task, it will copy static files, transpile and build core
 */
const runPublishTask = () => {
    //Copy static files
    console.log('Starting txAdmin Prod Builder.');
    copyStaticFiles('./dist/', 'publish');

    //Transpile & bundle core
    try {
        const { errors, _warnings } = esbuild.buildSync({
            entryPoints: ['./core'],
            bundle: true,
            outfile: './dist/core/index.js',
            platform: 'node',
            target: 'node16',
            minifyWhitespace: true,
            charset: 'utf8',
            define: {
                TX_PRERELEASE_BUILD_EXPIRATION: getPreReleaseExpiration(),
            },
            banner: {
                js: txLicenseBanner,
            },
        });
        if (errors.length) {
            console.log(`[BUNDLER] Failed with ${errors.length} errors.`);
            process.exit(1);
        }
    } catch (error) {
        console.log('[BUNDLER] Errored out.');
        console.dir(error);
        process.exit(1);
    }
    console.log('Publish task finished :)');
};


/**
 * Init parts
 */
process.stdout.write('.\n'.repeat(80) + '\x1B[2J\x1B[H');
const taskType = process.argv[2];
if (taskType === 'dev') {
    runDevTask();
} else if (taskType === 'publish') {
    runPublishTask();
} else {
    console.log('invalid task type');
    process.exit(1);
}
