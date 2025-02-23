import fs from 'node:fs';
import fsp from 'node:fs/promises';
import type { Dirent } from 'node:fs';
import { txEnv } from '@core/globalData';
import path from 'node:path';


/**
 * Check if its possible to create a file in a folder
 */
export const canWriteToPath = async (targetPath: string) => {
    try {
        await fsp.access(path.dirname(targetPath), fs.constants.W_OK);
        return true;
    } catch (error) {
        return false;
    }
}


/**
 * Returns an array of directory entries (files and directories) from the specified root path.
 */
export const getPathContent = async (root: string, filter?: (entry: Dirent) => boolean) => {
    const stats = await fsp.stat(root);
    if (!stats.isDirectory()) {
        throw new Error(`Path '${root}' is not a directory`);
    }
    const allEntries = await fsp.readdir(root, { withFileTypes: true });
    return allEntries.filter((entry) => (
        (entry.isFile() || entry.isDirectory())
            && filter ? filter(entry) : true
    ));
}


/**
 * Returns an array of file entries from the specified root path.
 */
export const getPathFiles = async (root: string, filter?: (entry: Dirent) => boolean) => {
    const entries = await getPathContent(root, filter);
    return entries.filter((entry) => entry.isFile());
}


/**
 * Returns an array of subdirectory entries from the specified root path.
 */
export const getPathSubdirs = async (root: string, filter?: (entry: Dirent) => boolean) => {
    const entries = await getPathContent(root, filter);
    return entries.filter((entry) => entry.isDirectory());
}


/**
 * Generates a user-friendly markdown error message for filesystem operations.
 * Handles common cases like Windows paths on Linux and permission issues.
 */
export const getFsErrorMdMessage = (error: any, targetPath: string) => {
    if(typeof error.message !== 'string') return 'unknown error';

    if (!txEnv.isWindows && /^[a-zA-Z]:[\\/]/.test(targetPath)) {
        return `Looks like you're using a Windows path on a Linux server.\nThis likely means you are attempting to use a path from your computer on a remote server.\nIf you want to use your local files, you will first need to upload them to the server.`;
    } else if (error.message?.includes('ENOENT')) {
        return `The path provided does not exist:\n\`${targetPath}\``;
    } else if (error.message?.includes('EACCES') || error.message?.includes('EPERM')) {
        return `The path provided is not accessible:\n\`${targetPath}\``;
    }

    return error.message as string;
}
