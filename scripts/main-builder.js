import fs from 'node:fs';
import path from 'node:path';
import child_process from 'node:child_process';
import { SemVer } from 'semver';
import chokidar from 'chokidar';
import debounce from 'lodash/debounce.js';
import esbuild from 'esbuild';
import { licenseBanner, getFxsPaths } from './scripts-utils.js';
import config from '../.deploy.config.js';

const txLicenseBannerComment = licenseBanner(undefined, true);
const txLicenseBannerFile = licenseBanner();


/**
 * Extracts the version from the GITHUB_REF env var and detects if pre-release
 */
const getPublishVersion = (isOptional) => {
    const workflowRef = process.env.GITHUB_REF;
    try {
        if (!workflowRef) {
            if (isOptional) {
                return {
                    txVersion: '9.9.9-dev',
                    isPreRelease: false,
                    preReleaseExpiration: '0',
                };
            } else {
                throw new Error('No --tag found.');
            }
        }
        const refRemoved = workflowRef.replace(/^(refs\/tags\/)?v/, '');
        const parsedVersion = new SemVer(refRemoved);
        const isPreRelease = parsedVersion.prerelease.length > 0;
        const potentialExpiration = new Date().setUTCHours(24 * config.preReleaseExpirationDays, 0, 0, 0);
        console.log(`txAdmin version ${parsedVersion.version}.`);
        return {
            txVersion: parsedVersion.version,
            isPreRelease,
            preReleaseExpiration: isPreRelease ? potentialExpiration.toString() : '0',
        };
    } catch (error) {
        console.error('Version setup failed: ' + error.message);
        process.exit(1);
    }
};


/**
 * Edits the ./dist/fxmanifest.lua to include the txAdmin version.
 * TODO: set up *_scripts automagically
 */
const setupDistFxmanifest = (targetPath, txVersion) => {
    console.log('[BUILDER] Setting up fxmanifest.lua: ' + txVersion);
    const fxManifestPath = path.join(targetPath, 'fxmanifest.lua');
    let fxManifestContent = fs.readFileSync(fxManifestPath, 'utf8');
    fxManifestContent = fxManifestContent.replace(/^version 'REPLACE-VERSION'$/m, `version '${txVersion}'`);
    fs.writeFileSync(fxManifestPath, fxManifestContent);
};


/**
 * Sync the files from local path to target path.
 * This function tried to remove the files before copying new ones,
 * therefore, first make sure the path is correct.
 * NOTE: each change, it resets the entire target path.
 * @param {String} targetPath
 * @param {String} txVersion
 * @param {String} eventName
 */
const copyStaticFiles = (targetPath, txVersion, eventName) => {
    console.log(`[COPIER][${eventName}] Syncing ${targetPath}.`);
    for (const srcPath of config.copy) {
        const destPath = path.join(targetPath, srcPath);
        fs.rmSync(destPath, { recursive: true, force: true });
        fs.cpSync(srcPath, destPath, { recursive: true });
    }
    setupDistFxmanifest(targetPath, txVersion);
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
                    env: {
                        ...process.env,
                        TERM: 'xterm-256color',
                        FORCE_COLOR: 3,
                        TXADMIN_DEV_SRC_PATH: process.cwd(),
                        TXADMIN_DEV_VITE_URL: config.panelViteUrl,
                    },
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
const runDevTask = async (txVersion, preReleaseExpiration) => {
    //Extract paths and validate them
    if (typeof process.env.TXADMIN_DEV_FXSERVER_PATH !== 'string') {
        console.error('process.env.TXADMIN_DEV_FXSERVER_PATH is not defined.');
        process.exit(1);
    }
    let fxServerRootPath, fxsBinPath, monitorPath;
    try {
        ({ fxServerRootPath, fxsBinPath, monitorPath } = getFxsPaths(process.env.TXADMIN_DEV_FXSERVER_PATH));
    } catch (error) {
        console.error('[BUILDER] Could not extract/validate the fxserver and monitor paths.');
        console.error(error);
        process.exit(1);
    }
    console.log(`[BUILDER] Starting txAdmin Dev Builder for ${fxServerRootPath}`);

    //Sync target path and start chokidar
    //We don't really care about the path, just remove everything and copy again
    copyStaticFiles(monitorPath, txVersion, 'init');
    const debouncedCopier = debounce((eventName) => {
        copyStaticFiles(monitorPath, txVersion, eventName);
    }, config.debouncerInterval);
    const staticWatcher = chokidar.watch(config.copy, {
        // awaitWriteFinish: true,
        persistent: true,
        ignoreInitial: true,
    });
    staticWatcher.on('add', () => { debouncedCopier('add'); });
    staticWatcher.on('change', () => { debouncedCopier('change'); });
    staticWatcher.on('unlink', () => { debouncedCopier('unlink'); });
    fs.writeFileSync(path.join(monitorPath, 'package.json'), '{"type":"commonjs"}');

    //Create txAdmin process runner
    const txInstance = new txAdminRunner(fxServerRootPath, fxsBinPath);

    //Listens on stdin for the key 'r'
    process.stdin.on('data', (data) => {
        const cmd = data.toString().toLowerCase().trim();
        if (cmd === 'r' || cmd === 'rr') {
            console.log(`[BUILDER] Restarting due to stdin request.`);
            txInstance.killServer();
            txInstance.spawnServer();
        } else if (cmd === 'cls' || cmd === 'clear') {
            console.clear();
        }
    });

    //Transpile & bundle
    //NOTE: "result" is {errors[], warnings[], stop()}
    console.log('[BUILDER] Setting up esbuild.');
    const buildOptions = {
        //no minify, no banner
        entryPoints: ['./core'],
        bundle: true,
        sourcemap: 'linked',
        outfile: path.join(monitorPath, 'core', 'index.js'),
        platform: 'node',
        target: 'node16',
        charset: 'utf8',
        define: { TX_PRERELEASE_EXPIRATION: preReleaseExpiration },
    };
    const plugins = [{
        name: 'fxsRestarter',
        setup(build) {
            build.onStart(() => {
                console.log(`[BUILDER] Build started.`);
                txInstance.killServer();
            });
            build.onEnd(({ errors }) => {
                if (errors.length) {
                    console.log(`[BUILDER] Failed with errors.`);
                } else {
                    console.log('[BUILDER] Finished build.');
                    txInstance.spawnServer();
                }
            });
        },
    }];

    try {
        const esbuildCtx = await esbuild.context({ ...buildOptions, plugins });
        await esbuildCtx.watch();
    } catch (error) {
        console.log('[BUILDER] Something went very wrong.');
        process.exit(1);
    }
};


/**
 * Main publish task, it will copy static files, transpile and build core
 */
const runPublishTask = (txVersion, preReleaseExpiration) => {
    //Copy static files
    console.log('Starting txAdmin Prod Builder');
    copyStaticFiles('./dist/', txVersion, 'publish');
    fs.writeFileSync('./dist/package.json', '{"type":"commonjs"}');
    fs.writeFileSync('./dist/LICENSE.txt', txLicenseBannerFile);

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
            define: { TX_PRERELEASE_EXPIRATION: preReleaseExpiration },
            banner: { js: txLicenseBannerComment },
            //To satisfy the license's "full text" requirement, it will be generated 
            //by another npm script and it is referenced in the banner.
            legalComments: 'none',
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
const taskType = process.argv[2];
if (taskType === 'dev') {
    process.stdout.write('.\n'.repeat(80) + '\x1B[2J\x1B[H');
    const { txVersion, preReleaseExpiration } = getPublishVersion(true);
    runDevTask(txVersion, preReleaseExpiration);
} else if (taskType === 'publish') {
    const { txVersion, isPreRelease, preReleaseExpiration } = getPublishVersion(false);
    fs.writeFileSync('.github/.cienv', `TX_IS_PRERELEASE=${isPreRelease}\n`);
    runPublishTask(txVersion, preReleaseExpiration);
} else {
    console.log('invalid task type');
    process.exit(1);
}
