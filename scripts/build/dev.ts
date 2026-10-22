import fs from 'node:fs';
import path from 'node:path/posix';
import chokidar from 'chokidar';
import debounce from 'lodash/debounce.js';
import esbuild, { BuildOptions } from 'esbuild';
import {
    copyStaticFiles,
    getFxsPaths,
    getPublishVersion,
} from './utils';
import config from './config';
import { parseTxDevEnv } from '../../shared/txDevEnv';
import { TxAdminRunner } from './TxAdminRunner';

process.loadEnvFile();

//Reset terminal
process.stdout.write('.\n'.repeat(40) + '\x1B[2J\x1B[H');

// @ts-ignore
const isBun = typeof Bun !== 'undefined';
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

if (isBun) {
    // @ts-ignore
    console.log(`[BUILDER] Running on Bun.js v${Bun.version}`);
} else if (isNode) {
    console.log(`[BUILDER] Running on Node.js v${process.versions.node}`);
} else {
    console.log('[BUILDER] Unknown JS runtime');
}

//Load the env vars, and check for the required ones
const txDevEnv = parseTxDevEnv();
if (!txDevEnv.FXSERVER_PATH || !txDevEnv.VITE_URL) {
    console.error(`Missing 'TXDEV_FXSERVER_PATH' and/or 'TXDEV_VITE_URL' env variables.`);
    console.error('Please read the docs/development.md file for more information.');
    process.exit(1);
}

//Setup
const { txVersion, preReleaseExpiration } = getPublishVersion(true);
let fxsPaths: ReturnType<typeof getFxsPaths>;
try {
    fxsPaths = getFxsPaths(txDevEnv.FXSERVER_PATH!);
} catch (error) {
    console.error('[BUILDER] Could not extract/validate the fxserver and resource paths.');
    console.error(error);
    process.exit(1);
}
console.log(`[BUILDER] Starting txAdmin Dev Builder for ${fxsPaths.root}`);

//Sync target path and start chokidar
//We don't really care about the path, just remove everything and copy again
copyStaticFiles(fxsPaths.res, txVersion, 'init');
const debouncedCopier = debounce((eventName) => {
    copyStaticFiles(fxsPaths.res, txVersion, eventName);
}, config.debouncerInterval);
const staticWatcher = chokidar.watch(config.copy, {
    // awaitWriteFinish: true,
    persistent: true,
    ignoreInitial: true,
});
staticWatcher.on('add', () => { debouncedCopier('add'); });
staticWatcher.on('change', () => { debouncedCopier('change'); });
staticWatcher.on('unlink', () => { debouncedCopier('unlink'); });
//yarn.installed Needs to be older than the package.json
fs.writeFileSync(path.join(fxsPaths.res, '.yarn.installed'), '');
fs.writeFileSync(path.join(fxsPaths.res, 'package.json'), '{"type":"commonjs"}');

//Create txAdmin process runner
const txInstance = new TxAdminRunner(fxsPaths.root, fxsPaths.bin, txDevEnv);

if (isBun) {
    // @ts-ignore
    Bun.serve({
        hostname: '127.0.0.1',
        port: 40123,
        fetch(request: Request) {
            const pathname = new URL(request.url).pathname;
            if (request.method === 'GET' && pathname === '/get-status') {
                return Response.json(txInstance.getStatus());
            }
            if (request.method === 'POST' && pathname === '/restart') {
                console.log('[BUILDER] HTTP restart requested; preserving automatic restart pause setting.');
                txInstance.restartServer();
                return Response.json(txInstance.getStatus());
            }
            if (request.method === 'POST' && (pathname === '/pause' || pathname === '/unpause')) {
                txInstance.setAutoRestartPaused(pathname === '/pause');
                return Response.json(txInstance.getStatus());
            }
            return new Response('Use GET /get-status or POST /restart, /pause, /unpause. Restart preserves autoRestartPaused.', { status: 404 });
        },
    });
    console.log('[BUILDER] Runner API: http://127.0.0.1:40123 (GET /get-status, POST /restart, /pause, /unpause)');
    console.log('[BUILDER] POST /restart preserves autoRestartPaused. POST /unpause applies any pending restart.');
}

//Listens on stdin for commands
process.stdin.on('data', (data) => {
    const cmd = data.toString().toLowerCase().trim();
    if (cmd === 'r' || cmd === 'rr') {
        txInstance.removeRebootPause();
        console.log(`[BUILDER] Restarting due to stdin request.`);
        txInstance.killServer();
        txInstance.spawnServer();
    } else if (cmd === 'p' || cmd === 'pause') {
        txInstance.setAutoRestartPaused(!txInstance.getStatus().autoRestartPaused);
    } else if (cmd === 'cls' || cmd === 'clear') {
        console.clear();
    }
});

//Transpile & bundle
//NOTE: "result" is {errors[], warnings[], stop()}
console.log('[BUILDER] Setting up esbuild.');
const buildOptions: BuildOptions = {
    //no minify, no banner
    entryPoints: ['./core'],
    bundle: true,
    sourcemap: 'linked',
    outfile: path.join(fxsPaths.res, 'core', 'index.js'),
    platform: 'node',
    target: 'node16',
    format: 'cjs', //typescript builds to esm and esbuild converts it to cjs
    charset: 'utf8',
    define: { 
        TX_PRERELEASE_EXPIRATION: preReleaseExpiration,
        TX_RELEASE_VERSION: JSON.stringify(txVersion),
    },
    plugins: [
        {
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
        },
    ],
};

try {
    const esbuildCtx = await esbuild.context(buildOptions);
    await esbuildCtx.watch();
} catch (error) {
    console.log('[BUILDER] Something went very wrong.');
    process.exit(1);
}
