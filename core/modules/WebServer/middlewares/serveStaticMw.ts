const modulename = 'WebServer:ServeStaticMw';
import path from 'path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import consoleFactory from '@lib/console';
import type { Next } from "koa";
import type { RawKoaCtx } from '../ctxTypes';
import zlib from 'node:zlib';
import bytes from 'bytes';
import { promisify } from 'util';
const console = consoleFactory(modulename);

const gzip = promisify(zlib.gzip);

class ScanLimitError extends Error {
    constructor(
        code: string,
        upperLimit: number,
        current: number,
    ) {
        super(`${code}: ${current} > ${upperLimit}`);
    }
}


/**
 * MARK: Types
 */
type ScanLimits = {
    MAX_BYTES?: number;
    MAX_FILES?: number;
    MAX_DEPTH?: number;
    MAX_TIME?: number;
}

type ServeStaticMwOpts = {
    noCaching: boolean;
    onReady: () => void;
    cacheMaxAge: number;
    roots: string[];
    limits: ScanLimits;
}

type ScanFolderState = {
    files: StaticFileCache[],
    bytes: number,
    tsStart: number,
    elapsedMs: number,
}

type ScanFolderOpts = {
    rootPath: string,
    state: ScanFolderState,
    limits: ScanLimits,
}

export type CompressionResult = {
    raw: Buffer,
    gz: Buffer,
}
type StaticFilePath = {
    url: string,
}
type StaticFileCache = CompressionResult & StaticFilePath;


/**
 * MARK: Caching Methods
 */
//Compression helper
const compressGzip = async (buffer: Buffer) => {
    return gzip(buffer, { chunkSize: 64 * 1024, level: 4 });
};


//Reads and compresses a file
export const getCompressedFile = async (fullPath: string) => {
    const raw = await fsp.readFile(fullPath);
    const gz = await compressGzip(raw);
    return { raw, gz };
};


//FIXME: This is a temporary function
const checkFileWhitelist = (rootPath: string, url: string) => {
    if (!rootPath.endsWith('panel')) return true;
    const nonHashedFiles = [
        '/favicon_default.svg',
        '/favicon_offline.svg',
        '/favicon_online.svg',
        '/favicon_partial.svg',
        '/index.html',
        '/img/discord.png',
        '/img/zap_login.png',
        '/img/zap_main.png'
    ];
    return nonHashedFiles.includes(url) || url.includes('.v800.');
}


//Scans a folder and returns all files processed with size and count limits
export const scanStaticFolder = async ({ rootPath, state, limits }: ScanFolderOpts) => {
    //100ms precision for elapsedMs
    let timerId
    if (limits.MAX_TIME) {
        timerId = setInterval(() => {
            state.elapsedMs = Date.now() - state.tsStart;
        }, 100);
    }

    let addedFiles = 0;
    let addedBytes = 0;
    const foldersToScan: string[][] = [[]];
    while (foldersToScan.length > 0) {
        const currFolderPath = foldersToScan.pop()!;
        const currentFolderUrl = path.posix.join(...currFolderPath);
        const currentFolderAbs = path.join(rootPath, ...currFolderPath);

        //Ensure we don't go over the limits
        if (limits.MAX_DEPTH && currFolderPath.length > limits.MAX_DEPTH) {
            throw new ScanLimitError('MAX_DEPTH', limits.MAX_DEPTH, currFolderPath.length);
        }

        const entries = await fsp.readdir(currentFolderAbs, { withFileTypes: true });
        for (const entry of entries) {
            if (limits.MAX_FILES && state.files.length > limits.MAX_FILES) {
                console.error('MAX_FILES ERROR', 'This likely means you did not erase the previous artifact files before adding new ones.');
                throw new ScanLimitError('MAX_FILES', limits.MAX_FILES, state.files.length);
            } else if (limits.MAX_BYTES && state.bytes > limits.MAX_BYTES) {
                console.error('MAX_BYTES ERROR', 'This likely means you did not erase the previous artifact files before adding new ones.');
                throw new ScanLimitError('MAX_BYTES', limits.MAX_BYTES, state.bytes);
            } else if (limits.MAX_TIME && state.elapsedMs > limits.MAX_TIME) {
                throw new ScanLimitError('MAX_TIME', limits.MAX_TIME, state.elapsedMs);
            }

            if (entry.isDirectory()) {
                //Queue the folder for scanning
                if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
                    foldersToScan.push([...currFolderPath, entry.name]);
                }
            } else if (entry.isFile()) {
                //Process the file
                const entryPathUrl = '/' + path.posix.join(currentFolderUrl, entry.name);
                if (!checkFileWhitelist(rootPath, entryPathUrl)) {
                    console.verbose.debug(`Skipping unknown file ${entryPathUrl}`);
                    continue;
                }

                const entryPathAbs = path.join(currentFolderAbs, entry.name);
                const fileData = await getCompressedFile(entryPathAbs);
                state.bytes += fileData.raw.length;
                state.files.push({
                    url: entryPathUrl,
                    ...fileData,
                });
                addedFiles++;
                addedBytes += fileData.raw.length;
            }
        }
    }

    if (timerId) {
        clearInterval(timerId);
    }

    return { addedFiles, addedBytes };
};


//Pre-processes all the static files
const preProcessFiles = async (opts: ServeStaticMwOpts) => {
    const scanState: ScanFolderState = {
        files: [],
        bytes: 0,
        tsStart: Date.now(),
        elapsedMs: 0,
    }
    for (const rootPath of opts.roots) {
        const res = await scanStaticFolder({
            rootPath,
            state: scanState,
            limits: opts.limits,
        });
        console.verbose.debug(`Cached ${res.addedFiles} (${bytes(res.addedBytes)}) files from '${rootPath}'.`);
    }

    const gzSize = scanState.files.reduce((acc, file) => acc + file.gz.length, 0);
    // console.dir({
    //     rawSize: bytes(rawSize),
    //     gzSize: bytes(gzSize),
    //     gzPct: (gzSize / rawSize * 100).toFixed(2) + '%',
    // });
    return {
        files: scanState.files,
        memSize: scanState.bytes + gzSize,
    };
}


/**
 * MARK: Cache Bootstrap
 */
const cacheDate = new Date().toUTCString(); //probably fine :P
let cachedFiles: StaticFileCache[] | undefined;
let bootstrapPromise: Promise<void> | null = null;
let bootstrapLastRun: number | null = null;

// Bootstraps the cache with state tracking
const bootstrapCache = async (opts: ServeStaticMwOpts): Promise<void> => {
    // Skip if already bootstrapped or running
    if (bootstrapPromise) return bootstrapPromise;
    if (cachedFiles) return;

    const now = Date.now();
    if (bootstrapLastRun && now - bootstrapLastRun < 15 * 1000) {
        return console.warn('bootstrapCache recently failed, skipping new attempt for cooldown.');
    }

    bootstrapLastRun = now;
    bootstrapPromise = (async () => {
        const tsStart = now;
        const { files, memSize } = await preProcessFiles(opts);
        cachedFiles = files;
        const elapsed = Date.now() - tsStart;
        console.verbose.debug(`Cached ${files.length} static files (${bytes(memSize)} in memory) in ${elapsed}ms`);
        opts.onReady();
    })();

    try {
        await bootstrapPromise;
    } finally {
        bootstrapPromise = null; // Clear the promise regardless of success or failure
    }
};


/**
 * MARK: Prod Middleware
 */
const serveStaticMwProd = (opts: ServeStaticMwOpts) => async (ctx: RawKoaCtx, next: Next) => {
    if (ctx.method !== 'HEAD' && ctx.method !== 'GET') {
        return await next();
    }

    // Skip bootstrap if cache is ready
    if (!cachedFiles) {
        try {
            await bootstrapCache(opts);
        } catch (error) {
            console.error(`Failed to bootstrap static files cache:`);
            console.dir(error);
        }
    }
    if (!cachedFiles) {
        return ctx.throw(503, 'Service Unavailable: Static files cache not ready');
    }

    //Check if the file is in the cache
    let staticFile: StaticFileCache | undefined;
    for (let i = 0; i < cachedFiles.length; i++) {
        const currCachedFile = cachedFiles[i];
        if (currCachedFile.url === ctx.path) {
            staticFile = currCachedFile;
            break;
        }
    }
    if (!staticFile) return await next();

    //Check if the client supports gzip
    //NOTE: dropped brotli, it's not worth the hassle
    if (ctx.acceptsEncodings('gzip', 'identity') === 'gzip') {
        ctx.set('Content-Encoding', 'gzip');
        ctx.body = staticFile.gz;
    } else {
        ctx.body = staticFile.raw;
    }

    //Determine the MIME type based on the original file extension
    ctx.type = path.extname(staticFile.url); // This sets the appropriate Content-Type header based on the extension

    //Set the client caching behavior (kinda conflicts with cacheControlMw)
    //NOTE: The legacy URLs already contain the `txVer` param to bust the cache, so 30 minutes should be fine
    ctx.set('Cache-Control', `public, max-age=${opts.cacheMaxAge}`);
    ctx.set('Last-Modified', cacheDate);
};


/**
 * MARK: Dev Middleware
 */
const serveStaticMwDev = (opts: ServeStaticMwOpts) => async (ctx: RawKoaCtx, next: Next) => {
    if (ctx.method !== 'HEAD' && ctx.method !== 'GET') {
        return await next();
    }

    const isValidPath = (urlPath: string) => {
        if (urlPath[0] !== '/') return false;
        if (urlPath.indexOf('\0') !== -1) return false;
        const traversalRegex = /(?:^|[\\/])\.\.(?:[\\/]|$)/;
        if (traversalRegex.test(path.normalize('./' + urlPath))) return false;
        if (!path.extname(urlPath)) return false;
        return true;
    }
    if (!isValidPath(ctx.path)) return await next();

    const tryAcquireFileStream = async (filePath: string) => {
        try {
            const stat = await fsp.stat(filePath);
            if (stat.isFile()) {
                return fs.createReadStream(filePath);
            }
        } catch (error) {
            if ((error as any).code === 'ENOENT') return;
            console.error(`Failed to create file read stream: ${filePath}`);
            console.dir(error);
        }
    }

    //Look for it in the roots
    let readStream: fs.ReadStream | undefined;
    for (const rootPath of opts.roots) {
        readStream = await tryAcquireFileStream(path.join(rootPath, ctx.path));
        if (readStream) break;
    }
    if (!readStream) return await next();

    ctx.body = readStream;
    ctx.type = path.extname(ctx.path);
    ctx.set('Cache-Control', `public, max-age=0`);
}


/**
 * Middleware responsible for serving all the static files.
 * For prod environments, it will cache all the files in memory, pre-compressed.
 */
export default function serveStaticMw(opts: ServeStaticMwOpts) {
    if (opts.noCaching) {
        opts.onReady();
        return serveStaticMwDev(opts);
    } else {
        bootstrapCache(opts).catch((error) => {
            console.error(`Failed to bootstrap static files cache:`);
            console.dir(error);
        });
        return serveStaticMwProd(opts);
    }
}
