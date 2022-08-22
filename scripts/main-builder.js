const fs = require('node:fs');
const path = require('node:path');
const chokidar = require('chokidar');
const debounce = require('lodash/debounce');
const TscWatchClient = require('tsc-watch/client.js');
const esbuild = require('esbuild');
const child_process = require('child_process');
const chalk = require('chalk');

const { licenseBanner } = require('./txAdmin-banners.js');
const txLicenseBanner = licenseBanner();

//FIXME: probably better to use .env with deploypath, sv_licensekey, etc
const config = require('../.deploy.config.js');
console.dir(config);


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
}


/**
 * Processes a fxserver path to validate it as well as the monitor folder.
 * NOTE: this function is windows only, but could be easily adapted.
 * @param {String} fxserverPath 
 * @returns fxServerRootPath, fxsBinPath, monitorPath
 */
const getFxsPaths = (fxserverPath) => {
    try {
        const fxServerRootPath = path.parse(fxserverPath).dir;

        //Process fxserver path
        const fxsBinPath = path.join(fxServerRootPath, 'FXServer.exe');
        const fxsBinPathStat = fs.statSync(fxsBinPath);
        if (!fxsBinPathStat.isFile()) {
            throw new Error(`${fxsBinPath} is not a file.`);
        }

        //Process monitor path
        const monitorPath = path.join(fxServerRootPath, 'citizen', 'system_resources', 'monitor');
        const monitorPathStat = fs.statSync(monitorPath);
        if (!monitorPathStat.isDirectory()) {
            throw new Error(`${monitorPath} is not a directory.`);
        }

        return { fxServerRootPath, fxsBinPath, monitorPath };
    } catch (error) {
        console.error(`Could not extract/validate the fxserver and monitor paths.`);
        console.error(error);
        process.exit(1);
    }
}


/**
 * Bundles the core files
 * @param {String} destRootPath 
 * @returns 
 */
const bundleCore = (destRootPath) => {
    return esbuild.buildSync({
        entryPoints: ['./dist_parts/core/index.js'],
        bundle: true,
        outfile: path.join(destRootPath, 'core', 'index.js'),
        platform: 'node',
        target: 'node16',
        minifyWhitespace: true,
        charset: 'utf8',
        banner: {
            js: txLicenseBanner,
        },
    });
}


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
            console.log(`[RUNNER] FXServer Closed.`);
        });
        this.fxChild.on('error', (err) => {
            console.log(`[RUNNER] FXServer Errored:`);
            console.dir(err);
        });
        this.fxChild.on('exit', () => {
            process.stdout.write('\n');
            console.log(`[RUNNER] FXServer Exited.`);
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
    const { fxServerRootPath, fxsBinPath, monitorPath } = getFxsPaths(config.fxserverPath);
    console.log(`Starting txAdmin Dev Builder for ${fxServerRootPath}`);

    //Sync target path and start chokidar
    //We don't really care about the path, just remove everything and copy again
    copyStaticFiles(monitorPath, 'init');
    const debouncedCopier = debounce(copyStaticFiles, config.debouncerInterval);
    const watcher = chokidar.watch(config.copy, {
        awaitWriteFinish: true,
        persistent: true,
        ignoreInitial: true,
    });
    watcher.on('add', () => { debouncedCopier(monitorPath, 'add') });
    watcher.on('change', () => { debouncedCopier(monitorPath, 'change') });
    watcher.on('unlink', () => { debouncedCopier(monitorPath, 'unlink') });

    //Create txAdmin process runner
    const txInstance = new txAdminRunner(fxServerRootPath, fxsBinPath);

    //Run tsc-watch
    const tscWatcher = new TscWatchClient();
    tscWatcher.on('started', () => {
        txInstance.killServer();
    });
    tscWatcher.on('success', () => {
        console.log('[BUILDER] running bundler...');
        const { errors, warnings } = bundleCore(monitorPath);
        if (errors.length) {
            console.log('[BUILDER] Bundler errored out.');
        } else {
            txInstance.spawnServer();
        }
    });
    tscWatcher.on('compile_errors', () => {
        console.log('[BUILDER] Awaiting for the errors to be fixed.');
    });
    tscWatcher.start(
        '--project', './core',
        '--noClear',
        '--pretty',
    );
}

const runPublishTask = () => {
    // copy static + resource files to dist
    copyStaticFiles('./dist/', 'publish');

    // `time npx tsc --project src/tsconfig.json --listEmittedFiles`
    // how???

    // `esbuild.buildSync()`
    // todo
}


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
    console.log(`invalid task type`);
    process.exit(1);
}
