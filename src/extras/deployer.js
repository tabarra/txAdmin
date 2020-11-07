//Requires
const modulename = 'Deployer';
const fs = require('fs-extra');
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);

//Helpers
const canCreateFile = async (targetPath) => {
    try {
        await fs.outputFile(path.join(targetPath, '.empty'), 'file save attempt, please ignore or remove');
        return true;
    } catch (error) {
        return false;
    }
}


/**
 * Perform deployer local target path permission/emptiness checking
 * FIXME: timeout to remove folders, or just autoremove them idk
 * @param {*} path 
 */
const validateTargetPath = async (deployPath) => {
    if(deployPath.includes(' ')) throw new Error(`The paths cannot contain spaces.`);

    if(await fs.pathExists(deployPath)){
        const pathFiles = await fs.readdir(deployPath);
        if(pathFiles.some(x => x !== '.empty')){
            throw new Error(`This folder is not empty!`);
        }else{
            if(await canCreateFile(deployPath)){
                //remove folder
                return `Exists, empty, and writtable!`;
            }else{
                throw new Error(`Path exists, but its not a folder, or its not writtable.`);
            }
        }
    }else{
        if(await canCreateFile(deployPath)){
            //remove folder
            return `Path didn't existed, we created one.`;
        }else{
            throw new Error(`Path doesn't exist, and we could not create it. Please check parent folder permissions.`);
        }
    }
}


/**
 * Validates a Recipe file
 * @param {*} rawRecipe 
 */
const parseRecipe = (rawRecipe) => {
    if(typeof rawRecipe !== 'string') throw new Error(`not a string`);

    return {
        name: `tempname`
    };
}


/**
 * 
 */
class Deployer {
    constructor(rawRecipe, deployPath) {
        log('Deployer instance started');
        // const recipe = await parseRecipe(res.data);
    }

    /**
     * Sets the cache
     * @param {*} data
     */
    set(data){
        // xxxxxx
    }
} //Fim Deployer()


module.exports = {
    Deployer,
    validateTargetPath,
    parseRecipe
}