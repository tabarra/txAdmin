//FIXME: after refactor, move to the correct path
import bytes from 'bytes';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { txEnv } from './globalData';

//Hash test
const hashFile = async (filePath: string) => {
    const rawFile = await fs.readFile(filePath, 'utf8')
    const normalized = rawFile.normalize('NFKC')
        .replace(/\r\n/g, '\n')
        .replace(/^\uFEFF/, '');
    return createHash('sha1').update(normalized).digest('hex');
}

// Limits
const MAX_FILES = 300;
const MAX_TOTAL_SIZE = bytes('50MB');
const MAX_FILE_SIZE = bytes('20MB');
const MAX_DEPTH = 10;
const MAX_EXECUTION_TIME = 30 * 1000;
const IGNORED_FOLDERS = [
    'db',
    'cache',
    'dist',
    '.reports',
    'license_report',
    'tmp_core_tsc',
    'node_modules',
    'txData',
];


type ContentFileType = {
    path: string;
    size: number;
    hash: string;
}

export default async function checksumMonitorFolder() {
    const rootPath = txEnv.txAdminResourcePath;
    const allFiles: ContentFileType[] = [];
    let totalFiles = 0;
    let totalSize = 0;

    try {
        const tsStart = Date.now();
        const scanDir = async (dir: string, depth: number = 0) => {
            if (depth > MAX_DEPTH) {
                throw new Error('MAX_DEPTH');
            }

            let filesFound = 0;
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                if (totalFiles >= MAX_FILES) {
                    throw new Error('MAX_FILES');
                } else if (totalSize >= MAX_TOTAL_SIZE) {
                    throw new Error('MAX_TOTAL_SIZE');
                } else if (Date.now() - tsStart > MAX_EXECUTION_TIME) {
                    throw new Error('MAX_EXECUTION_TIME');
                }

                const entryPath = path.join(dir, entry.name);
                let relativeEntryPath = path.relative(rootPath, entryPath);
                relativeEntryPath = './' + relativeEntryPath.split(path.sep).join(path.posix.sep);

                if (entry.isDirectory()) {
                    if (IGNORED_FOLDERS.includes(entry.name)) {
                        continue;
                    }
                    await scanDir(entryPath, depth + 1);
                } else if (entry.isFile()) {
                    const stats = await fs.stat(entryPath);
                    if (stats.size > MAX_FILE_SIZE) {
                        throw new Error('MAX_SIZE');
                    }

                    allFiles.push({
                        path: relativeEntryPath,
                        size: stats.size,
                        hash: await hashFile(entryPath),
                    });
                    filesFound++;
                    totalFiles++;
                    totalSize += stats.size;
                }
            }
            return filesFound;
        };
        await scanDir(rootPath);
        allFiles.sort((a, b) => a.path.localeCompare(b.path));
        return {
            totalFiles,
            totalSize,
            allFiles,
        };
    } catch (error) {
        //At least saving the progress
        return {
            error: (error as any).message,
            totalFiles,
            totalSize,
            allFiles,
        };
    }
}
