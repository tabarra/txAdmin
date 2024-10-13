import * as fsp from 'node:fs/promises';
import * as path from 'node:path';

const IGNORED_DIRS = ['cache', 'db', 'node_modules', '.git', '.idea', '.vscode'];
const MANIFEST_FILES = ['fxmanifest.lua', '__resource.lua'];
const RES_CATEGORIES_LIMIT = 100;
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
        const currCategory = categoriesToScan.shift() as string;
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
