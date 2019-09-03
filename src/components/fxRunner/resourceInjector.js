//Requires
const fs = require('fs-extra');
const path = require('path');
const slash = require('slash');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../extras/console');
const context = 'ResourceInjector';


//================================================================
/**
 * Reset the fxserver resources/[txAdmin-cache] folder.
 */
async function resetCacheFolder(basePath) {
    let resFolder = slash(path.normalize(`${basePath}/resources/`));
    if(!fs.existsSync(resFolder)) throw new Error('[resetCacheFolder] Resources folder not found');
    try {
        await fs.emptyDir(`${resFolder}/[txAdmin-cache]/`);
    } catch (error) {
        throw new Error(`[resetCacheFolder] Error resetting [txAdmin-cache] folder: ${error.message}`);
    }

    return true;
}


//================================================================
/**
 * Get the list of extensions that require an extension
 * NOTE: I could use withFileTypes, but that's node v10.10+ only
 */
function getResourcesList() {
    try {
        let rootDir = './extensions/';
        var paths = fs.readdirSync(rootDir);
        let resources = [];
        paths.forEach((path)=>{
            if(!fs.lstatSync(rootDir+path).isDirectory()) return;
            if(fs.existsSync(rootDir+path+'/resource/__resource.lua')){
                resources.push(path)
            }
        });

        return resources;
    } catch (error) {
        throw new Error(`[getResourcesList] Error resetting [txAdmin-cache] folder: ${error.message}`);
    }
}


//================================================================
/**
 * Copy all the resources to the server's resource folder
 */
async function inject(basePath, resList) {
    try {
        let promFunc = async (src, dst) => {
            await fs.ensureDir(dst);
            await fs.copy(src, dst)
        }

        let rootDir = './extensions/';
        let cachePath = `${basePath}/resources/[txAdmin-cache]`;
        let promises = []
        resList.forEach((res) => {
            promises.push(promFunc(rootDir+res+'/resource', cachePath+'/'+res));
        });
        await Promise.all(promises);
        return true;
    } catch (error) {
        throw new Error(`[inject] Error injecting resources: ${error.message}`);
    }
}


module.exports = {
    resetCacheFolder,
    getResourcesList,
    inject,
}
