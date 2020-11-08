//Requires
const modulename = 'Deployer';
const YAML = require('js-yaml');
const fs = require('fs-extra');
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);
const recipeEngine = require('./recipeEngine');

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };
const toDefault = (input, defVal) => { return (isUndefined(input))? defVal : input };
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
 * TODO: use Joi for schema validaiton
 * @param {*} rawRecipe 
 */
const parseRecipe = (rawRecipe) => {
    if(typeof rawRecipe !== 'string') throw new Error(`not a string`);
    
    //Loads YAML
    let recipe;
    try {
        recipe = YAML.safeLoad(rawRecipe, { schema: YAML.JSON_SCHEMA });   
    } catch (error) {
        if(GlobalData.verbose) dir(error);
        throw new Error(`invalid yaml`);
    }

    //Basic validation
    if(typeof recipe !== 'object') throw new Error(`invalid YAML, couldn't resolve to object`);
    if(!Array.isArray(recipe.tasks)) throw new Error(`no tasks array found`);

    //Preparing output
    const outRecipe = {
        name: toDefault(recipe.name, 'unnamed'),
        version: toDefault(recipe.version, null),
        author: toDefault(recipe.author, 'unknown'),
        tasks: []
    };

    //Checking engine version
    if(typeof recipe['$engine'] == 'string'){
        if(recipe['$engine'] !== 1) throw new Error(`unsupported '$engine' version ${recipe['$engine']}`);
    }else{
        outRecipe.recipeEngineVersion = 1;
    }

    //Validate tasks
    recipe.tasks.forEach((task, index) => {
        if(typeof task.action !== 'string') throw new Error(`TASK:${index+1} no action specified`);
        if(typeof recipeEngine.tasks[task.action] === 'undefined') throw new Error(`TASK:${index+1} unknown action '${task.action}'`);
        if(!recipeEngine.tasks[task.action].validate(task)) throw new Error(`TASK:${index+1}:${task.action} invalid parameters`);
        outRecipe.tasks.push(task)
    });

    if(GlobalData.verbose) dir(outRecipe);
    return outRecipe;
}


/**
 * FIXME: describr it in here
 */
class Deployer {
    constructor(rawRecipe, deployPath) {
        log('Deployer instance started');

        //DEBUG:
        try {
            rawRecipe = fs.readFileSync(`${GlobalData.txAdminResourcePath}/src/webroutes/deployer/recipe.ignore.yaml`).toString().trim();
            deployPath = 'E:/FiveM/BUILDS/txData/keepkeep.base/';
            const recipe = parseRecipe(rawRecipe);
            log('recipe parsed');
        } catch (error) {
            dir(error)
        }

    }

    /**
     * Sets the cache
     * @param {*} data
     */
    xxxxxx(data){
        // xxxxxx
    }
} //Fim Deployer()


module.exports = {
    Deployer,
    validateTargetPath,
    parseRecipe
}
