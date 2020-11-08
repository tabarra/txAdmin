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
const parseValidateRecipe = (rawRecipe) => {
    if(typeof rawRecipe !== 'string') throw new Error(`not a string`);
    
    //Loads YAML
    let recipe;
    try {
        recipe = YAML.safeLoad(rawRecipe, { schemax: YAML.JSON_SCHEMA });   
    } catch (error) {
        if(GlobalData.verbose) dir(error);
        throw new Error(`invalid yaml`);
    }

    //Basic validation
    if(typeof recipe !== 'object') throw new Error(`invalid YAML, couldn't resolve to object`);
    if(!Array.isArray(recipe.tasks)) throw new Error(`no tasks array found`);

    //Preparing output
    const outRecipe = {
        raw: rawRecipe.trim(),
        name: toDefault(recipe.name, 'unnamed').trim(),
        version: toDefault(recipe.version, '').trim(),
        author: toDefault(recipe.author, 'unknown').trim(),
        description: toDefault(recipe.description, '').trim(),
        tasks: []
    };

    //Checking engine version
    if(typeof recipe['$engine'] == 'number'){
        if(recipe['$engine'] !== 1) throw new Error(`unsupported '$engine' version ${recipe['$engine']}`);
    }else{
        outRecipe.recipeEngineVersion = 1;
    }

    //Validate tasks
    recipe.tasks.forEach((task, index) => {
        if(typeof task.action !== 'string') throw new Error(`[task${index+1}] no action specified`);
        if(typeof recipeEngine.tasks[task.action] === 'undefined') throw new Error(`[task${index+1}] unknown action '${task.action}'`);
        if(!recipeEngine.tasks[task.action].validate(task)) throw new Error(`[task${index+1}:${task.action}] invalid parameters`);
        outRecipe.tasks.push(task)
    });

    if(GlobalData.verbose) dir(outRecipe);
    return outRecipe;
}


/**
 * The deployer class is responsible for running the recipe and handling status and errors
 * FIXME: add some logging (terminal)
 */
class Deployer {
    /**
     * @param {string} originalRecipe 
     * @param {string} deployPath 
     * @param {boolean} isTrustedSource 
     */
    constructor(originalRecipe, deployPath, isTrustedSource) {
        log('Deployer instance ready.');
        
        //Setup variables        
        this.step = 'review';
        this.deployPath = deployPath;
        this.isTrustedSource = isTrustedSource;
        this.originalRecipe = originalRecipe;
        this.progress = 0;
        this.log = [];

        //Load recipe
        try {
            this.recipe = parseValidateRecipe(originalRecipe);
        } catch (error) {
            throw new Error(`Recipe Error: ${error.message}`);
        }
    }

    /**
     * Starts the deployment process
     * @param {string} userRecipe 
     */
    start(userRecipe){
        log('Starting deployer runner');
        try {
            this.recipe = parseValidateRecipe(userRecipe);
        } catch (error) {
            throw new Error(`Recipe Error: ${error.message}`);
        }
        this.progress = 0;
        this.step = 'running';
        this.log.push('Starting deployment...');
        this.runTasks();
    }

    /**
     * (Private) Run the tasks in a sequential way.
     */
    async runTasks(){
        for (let index = 0; index < this.recipe.tasks.length; index++) {
            this.progress = Math.round((index/this.recipe.tasks.length)*100);

            const task = this.recipe.tasks[index];
            const taskID = `[task${index+1}:${task.action}]`;
            this.log.push(`Running ${taskID}...`);
            log(`Running ${taskID}`);

            try {
                await recipeEngine.tasks[task.action].run(task, this.deployPath)
                this.log[this.log.length -1] += ` ✔️`;
            } catch (error) {
                this.log[this.log.length -1] += ` ❌`;
                const msg = `${taskID} failed with message: ${error.message}`;
                logError(msg);
                this.log.push(msg)
                return;
            }
        }

        this.progress = 100;
        this.log.push(`All tasks done!`)
        logOk(`All tasks done!`)
        this.step = 'configuring';
    }
} //Fim Deployer()


module.exports = {
    Deployer,
    validateTargetPath,
    parseValidateRecipe
}
