import { txEnv } from '@core/globalData';
import { getFsErrorMdMessage, getPathSubdirs } from '@lib/fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';

const IGNORED_DIRS = ['cache', 'db', 'node_modules', '.git', '.idea', '.vscode'];
const MANIFEST_FILES = ['fxmanifest.lua', '__resource.lua'];
const RES_CATEGORIES_LIMIT = 250; //Some servers go over 100
const CFG_SIZE_LIMIT = 32 * 1024; //32kb


//Types
export type ServerDataContentType = [string, number | boolean][];
export type ServerDataConfigsType = [string, string][];


/**
 * Scans a server data folder and lists all files, up to the first level of each resource.
 * Behavior reference: fivem/code/components/citizen-server-impl/src/ServerResources.cpp
 * 
 * NOTE: this would probably be better 
 * 
 * TODO: the current sorting is not right, changing it back to recursive (depth-first) would 
 * probably solve it, but right now it's not critical.
 * A better behavior would be to set "MAX_DEPTH" and do that for all folders, ignoring "resources"/[categories]
 */
export const getServerDataContent = async (serverDataPath: string): Promise<ServerDataContentType> => {
    //Runtime vars
    let resourcesInRoot = false;
    const content: ServerDataContentType = []; //relative paths
    let resourceCategories = 0;

    //Scan root path
    const rootEntries = await fsp.readdir(serverDataPath, { withFileTypes: true });
    for (const entry of rootEntries) {

        if (entry.isDirectory()) {
            content.push([entry.name, false]);
            if (entry.name === 'resources') {
                resourcesInRoot = true;
            }
        } else if (entry.isFile()) {
            const stat = await fsp.stat(path.join(serverDataPath, entry.name));
            content.push([entry.name, stat.size]);
        }
    }
    //no resources, early return
    if (!resourcesInRoot) return content;


    //Scan categories
    const categoriesToScan = [path.join(serverDataPath, 'resources')];
    while (categoriesToScan.length) {
        if (resourceCategories >= RES_CATEGORIES_LIMIT) {
            throw new Error(`Scanning above the limit of ${RES_CATEGORIES_LIMIT} resource categories.`);
        }
        resourceCategories++;
        const currCategory = categoriesToScan.shift()!;
        const currCatDirEntries = await fsp.readdir(currCategory, { withFileTypes: true });

        for (const catDirEntry of currCatDirEntries) {
            const catDirEntryFullPath = path.join(currCategory, catDirEntry.name);
            const catDirEntryRelativePath = path.relative(serverDataPath, catDirEntryFullPath);

            if (catDirEntry.isDirectory()) {
                content.push([path.relative(serverDataPath, catDirEntryFullPath), false]);
                if (!catDirEntry.name.length || IGNORED_DIRS.includes(catDirEntry.name)) continue;

                if (catDirEntry.name[0] === '[' && catDirEntry.name[catDirEntry.name.length - 1] === ']') {
                    //It's a category
                    categoriesToScan.push(catDirEntryFullPath);

                } else {
                    //It's a resource
                    const resourceFullPath = catDirEntryFullPath;
                    const resourceRelativePath = catDirEntryRelativePath;
                    let resourceHasManifest = false;
                    const resDirEntries = await fsp.readdir(resourceFullPath, { withFileTypes: true });

                    //for every file/folder in resources folder
                    for (const resDirEntry of resDirEntries) {
                        const resEntryFullPath = path.join(resourceFullPath, resDirEntry.name);
                        const resEntryRelativePath = path.join(resourceRelativePath, resDirEntry.name);
                        if (resDirEntry.isDirectory()) {
                            content.push([resEntryRelativePath, false]);

                        } else if (resDirEntry.isFile()) {
                            const stat = await fsp.stat(resEntryFullPath);
                            content.push([resEntryRelativePath, stat.size]);
                            if (!resourceHasManifest && MANIFEST_FILES.includes(resDirEntry.name)) {
                                resourceHasManifest = true;
                            }
                        }
                    };
                }

            } else if (catDirEntry.isFile()) {
                const stat = await fsp.stat(catDirEntryFullPath);
                content.push([catDirEntryRelativePath, stat.size]);
            }
        }
    }//while categories

    // Sorting content (folders first, then utf8)
    content.sort(([aName, aSize], [bName, bSize]) => {
        const aDir = path.parse(aName).dir;
        const bDir = path.parse(bName).dir;
        if (aDir !== bDir) {
            return aName.localeCompare(bName);
        } else if (aSize === false && bSize !== false) {
            return -1;
        } else if (aSize !== false && bSize === false) {
            return 1;
        } else {
            return aName.localeCompare(bName);
        }
    });

    return content;
}


/**
 * Returns the content of all .cfg files based on a server data content scan.
 */
export const getServerDataConfigs = async (serverDataPath: string, serverDataContent: ServerDataContentType): Promise<ServerDataConfigsType> => {
    const configs: ServerDataConfigsType = [];
    for (const [entryPath, entrySize] of serverDataContent) {
        if (typeof entrySize !== 'number' || !entryPath.endsWith('.cfg')) continue;
        if (entrySize > CFG_SIZE_LIMIT) {
            configs.push([entryPath, 'file is too big']);
        }

        try {
            const rawData = await fsp.readFile(path.join(serverDataPath, entryPath), 'utf8');
            configs.push([entryPath, rawData]);
        } catch (error) {
            configs.push([entryPath, (error as Error).message]);
        }
    }

    return configs;
}


/**
 * Validate server data path for the 
 */
export const isValidServerDataPath = async (dataPath: string) => {
    //Check if root folder is valid
    try {
        const rootEntries = await getPathSubdirs(dataPath);
        if (!rootEntries.some(e => e.name === 'resources')) {
            throw new Error('The provided directory does not contain a \`resources\` subdirectory.');
        }
    } catch (err) {
        const error = err as Error;
        let msg = getFsErrorMdMessage(error, dataPath);
        if (dataPath.includes('resources')) {
            msg = `Looks like this path is the \`resources\` folder, but the server data path must be the folder that contains the resources folder instead of the resources folder itself.\n**Try removing the \`resources\` part at the end of the path.**`;
        }
        throw new Error(msg);
    }

    //Check if resources folder is valid
    try {
        const resourceEntries = await getPathSubdirs(path.join(dataPath, 'resources'));
        if (!resourceEntries.length) {
            throw new Error('The \`resources\` directory is empty.');
        }
    } catch (err) {
        const error = err as Error;
        let msg = error.message;
        if (error.message?.includes('ENOENT')) {
            msg = `The \`resources\` directory does not exist inside the provided Server Data Folder:\n\`${dataPath}\``;
        } else if (error.message?.includes('EACCES') || error.message?.includes('EPERM')) {
            msg = `The \`resources\` directory is not accessible inside the provided Server Data Folder:\n\`${dataPath}\``;
        }
        throw new Error(msg);
    }
    return true;
};


/**
 * Look for a potential server data folder in/around the provided path.
 * Forgiving behavior:
 *  - Ignore trailing slashes, as well as fix backslashes
 *  - Check if its the parent folder
 *  - Check if its a sibling folder
 *  - Check if its a child folder
 *  - Check if current path is a resource folder deep inside a server data folder
 */
export const findPotentialServerDataPaths = async (initialPath: string) => {
    const checkTarget = async (target: string) => {
        try {
            return await isValidServerDataPath(target);
        } catch (error) {
            return false;
        }
    };

    //Recovery if parent folder
    const parentPath = path.join(initialPath, '..');
    const isParentPath = await checkTarget(parentPath);
    if (isParentPath) return parentPath;

    //Recovery if sibling folder
    try {
        const siblingPaths = await getPathSubdirs(parentPath);
        for (const sibling of siblingPaths) {
            const siblingPath = path.join(parentPath, sibling.name);
            if (siblingPath === initialPath) continue;
            if (await checkTarget(siblingPath)) return siblingPath;
        }
    } catch (error) { }

    //Recovery if children folder
    try {
        const childPaths = await getPathSubdirs(initialPath);
        for (const child of childPaths) {
            const childPath = path.join(initialPath, child.name);
            if (await checkTarget(childPath)) return childPath;
        }
    } catch (error) { }

    //Recovery if current path is a resources folder
    const resourceSplitAttempt = initialPath.split(/[/\\]resources(?:[/\\]?|$)/, 2);
    if (resourceSplitAttempt.length === 2) {
        const potentialServerDataPath = resourceSplitAttempt[0];
        if (await checkTarget(potentialServerDataPath)) return potentialServerDataPath;
    }

    //Really couldn't find anything
    return false;
};
