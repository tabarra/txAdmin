const modulename = 'Deployer';
import path from 'node:path';
import { cloneDeep }  from 'lodash-es';
import dateFormat from 'dateformat';
import fse from 'fs-extra';
import open from 'open';
import YAML from 'js-yaml';
import getOsDistro from '@core/extras/getOsDistro.js';
import { txEnv } from '@core/globalData';
import recipeEngine from './recipeEngine.js';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);


//Helper functions
const getTimestamp = () => { return dateFormat(new Date(), 'HH:MM:ss'); };
const isUndefined = (x) => { return (typeof x === 'undefined'); };
const toDefault = (input, defVal) => { return (isUndefined(input)) ? defVal : input; };
const canCreateFile = async (targetPath) => {
    try {
        const filePath = path.join(targetPath, '.empty');
        await fse.outputFile(filePath, '#save_attempt_please_ignore');
        await fse.remove(filePath);
        return true;
    } catch (error) {
        return false;
    }
};
const makeTemplateRecipe = (serverName, author) => `name: ${serverName}
author: ${author}

# This is just a placeholder, please don't run it!
tasks: 
    - action: waste_time
      seconds: 5
    - action: waste_time
      seconds: 5
`;

//Constants
export const engineVersion = 3;


/**
 * Perform deployer local target path permission/emptiness checking
 * FIXME: timeout to remove folders, or just autoremove them idk
 * @param {*} path
 */
export const validateTargetPath = async (deployPath) => {
    if (await fse.pathExists(deployPath)) {
        const pathFiles = await fse.readdir(deployPath);
        if (pathFiles.some((x) => x !== '.empty')) {
            throw new Error('This folder is not empty!');
        } else {
            if (await canCreateFile(deployPath)) {
                return 'Exists, empty, and writtable!';
            } else {
                throw new Error('Path exists, but its not a folder, or its not writtable.');
            }
        }
    } else {
        if (await canCreateFile(deployPath)) {
            await fse.remove(deployPath);
            return 'Path didn\'t existed, we created one (then deleted it).';
        } else {
            throw new Error('Path doesn\'t exist, and we could not create it. Please check parent folder permissions.');
        }
    }
};


/**
 * Validates a Recipe file
 * TODO: use Joi for schema validaiton
 * @param {*} rawRecipe
 */
export const parseValidateRecipe = (rawRecipe) => {
    if (typeof rawRecipe !== 'string') throw new Error('not a string');

    //Loads YAML
    let recipe;
    try {
        recipe = YAML.load(rawRecipe, { schema: YAML.JSON_SCHEMA });
    } catch (error) {
        console.verbose.dir(error);
        throw new Error('invalid yaml');
    }

    //Basic validation
    if (typeof recipe !== 'object') throw new Error('invalid YAML, couldn\'t resolve to object');
    if (!Array.isArray(recipe.tasks)) throw new Error('no tasks array found');

    //Preparing output
    const outRecipe = {
        raw: rawRecipe.trim(),
        name: toDefault(recipe.name, 'unnamed').trim(),
        author: toDefault(recipe.author, 'unknown').trim(),
        description: toDefault(recipe.description, '').trim(),
        variables: {},
        tasks: [],
    };

    //Checking/parsing meta tag requirements
    if (typeof recipe['$onesync'] == 'string') {
        const onesync = recipe['$onesync'].trim();
        if (!['off', 'legacy', 'on'].includes(onesync)) throw new Error(`the onesync option selected required for this recipe ("${onesync}") is not supported by this FXServer version.`);
        outRecipe.onesync = onesync;
    }
    if (typeof recipe['$minFxVersion'] == 'number') {
        if (recipe['$minFxVersion'] > txEnv.fxServerVersion) throw new Error(`this recipe requires FXServer v${recipe['$minFxVersion']} or above`);
        outRecipe.fxserverMinVersion = recipe['$minFxVersion']; //useless for now
    }
    if (typeof recipe['$engine'] == 'number') {
        if (recipe['$engine'] < engineVersion) throw new Error(`unsupported '$engine' version ${recipe['$engine']}`);
        outRecipe.recipeEngineVersion = recipe['$engine']; //useless for now
    }

    //Validate tasks
    if (!Array.isArray(recipe.tasks)) throw new Error('no tasks array found');
    recipe.tasks.forEach((task, index) => {
        if (typeof task.action !== 'string') throw new Error(`[task${index + 1}] no action specified`);
        if (typeof recipeEngine[task.action] === 'undefined') throw new Error(`[task${index + 1}] unknown action '${task.action}'`);
        if (!recipeEngine[task.action].validate(task)) throw new Error(`[task${index + 1}:${task.action}] invalid parameters`);
        outRecipe.tasks.push(task);
    });

    //Process inputs
    outRecipe.requireDBConfig = recipe.tasks.some((t) => t.action.includes('database'));
    const protectedVarNames = ['licenseKey', 'dbHost', 'dbUsername', 'dbPassword', 'dbName', 'dbConnection', 'dbPort'];
    if (typeof recipe.variables == 'object' && recipe.variables !== null) {
        const varNames = Object.keys(recipe.variables);
        if (varNames.some((n) => protectedVarNames.includes(n))) {
            throw new Error('One or more of the variables declared in the recipe are not allowed.');
        }
        Object.assign(outRecipe.variables, recipe.variables);
    }

    //Output
    return outRecipe;
};


/**
 * The deployer class is responsible for running the recipe and handling status and errors
 * TODO: log everything to deployPath/recipe.log
 */
export class Deployer {
    /**
     * @param {string} originalRecipe
     * @param {string} deployPath
     * @param {boolean} isTrustedSource
     */
    constructor(originalRecipe, deploymentID, deployPath, isTrustedSource, customMetaData = {}) {
        console.log('Deployer instance ready.');

        //Setup variables
        this.step = 'review';
        this.deployFailed = false;
        this.deployPath = deployPath;
        this.isTrustedSource = isTrustedSource;
        this.originalRecipe = originalRecipe;
        this.deploymentID = deploymentID;
        this.progress = 0;
        this.serverName = customMetaData.serverName || globals.txAdmin.globalConfig.serverName || '';
        this.logLines = [];

        //Load recipe
        const impRecipe = (originalRecipe !== false)
            ? originalRecipe
            : makeTemplateRecipe(customMetaData.serverName, customMetaData.author);
        try {
            this.recipe = parseValidateRecipe(impRecipe);
        } catch (error) {
            console.verbose.dir(error);
            throw new Error(`Recipe Error: ${error.message}`);
        }
    }

    //Dumb helpers - don't care enough to make this less bad
    customLog(str) {
        this.logLines.push(`[${getTimestamp()}] ${str}`);
        console.log(str);
    }
    customLogError(str) {
        this.logLines.push(`[${getTimestamp()}] ${str}`);
        console.error(str);
    }
    getDeployerLog() {
        return this.logLines.join('\n');
    }

    /**
     * Confirms the recipe and goes to the input stage
     * @param {string} userRecipe
     */
    async confirmRecipe(userRecipe) {
        if (this.step !== 'review') throw new Error('expected review step');

        //Parse/set recipe
        try {
            this.recipe = parseValidateRecipe(userRecipe);
        } catch (error) {
            throw new Error(`Cannot start() deployer due to a Recipe Error: ${error.message}`);
        }

        //Ensure deployment path
        try {
            await fse.ensureDir(this.deployPath);
        } catch (error) {
            console.verbose.dir(error);
            throw new Error(`Failed to create ${this.deployPath} with error: ${error.message}`);
        }

        this.step = 'input';
    }

    /**
     * Returns the recipe variables for the deployer run step
     */
    getRecipeVars() {
        if (this.step !== 'input') throw new Error('expected input step');
        return cloneDeep(this.recipe.variables);
        //TODO: ?? Object.keys pra montar varname: {type: 'string'}?
    }

    /**
     * Starts the deployment process
     * @param {string} userInputs
     */
    start(userInputs) {
        if (this.step !== 'input') throw new Error('expected input step');
        Object.assign(this.recipe.variables, userInputs);
        this.logLines = [];
        this.customLog(`Starting deployment of ${this.recipe.name}.`);
        this.deployFailed = false;
        this.progress = 0;
        this.step = 'run';
        this.runTasks();
    }

    /**
     * Marks the deploy as failed
     */
    async markFailedDeploy() {
        this.deployFailed = true;
        try {
            const filePath = path.join(this.deployPath, '_DEPLOY_FAILED_DO_NOT_USE');
            await fse.outputFile(filePath, 'This deploy was failed, please do not use these files.');
        } catch (error) { }
    }

    /**
     * (Private) Run the tasks in a sequential way.
     */
    async runTasks() {
        if (this.step !== 'run') throw new Error('expected run step');
        const contextVariables = cloneDeep(this.recipe.variables);
        contextVariables.deploymentID = this.deploymentID;
        contextVariables.serverName = this.serverName;
        contextVariables.recipeName = this.recipe.name;
        contextVariables.recipeAuthor = this.recipe.author;
        contextVariables.recipeDescription = this.recipe.description;

        //Run all the tasks
        for (let index = 0; index < this.recipe.tasks.length; index++) {
            this.progress = Math.round((index / this.recipe.tasks.length) * 100);
            const task = this.recipe.tasks[index];
            const taskID = `[task${index + 1}:${task.action}]`;
            this.customLog(`Running ${taskID}...`);
            const taskTimeoutSeconds = task.timeoutSeconds ?? recipeEngine[task.action].timeoutSeconds;

            try {
                contextVariables.$step = `loading task ${task.action}`;
                await Promise.race([
                    recipeEngine[task.action].run(task, this.deployPath, contextVariables),
                    new Promise((resolve, reject) => {
                        setTimeout(() => {
                            reject(new Error(`timed out after ${taskTimeoutSeconds}s.`));
                        }, taskTimeoutSeconds * 1000);
                    }),
                ]);
                this.logLines[this.logLines.length - 1] += ' ✔️';
            } catch (error) {
                this.logLines[this.logLines.length - 1] += ' ❌';
                let msg = `Task Failed: ${error.message}\n`
                    + 'Options: \n'
                    + JSON.stringify(task, null, 2);
                if (contextVariables.$step) {
                    msg += '\nDebug/Status: '
                        + JSON.stringify([
                            txEnv.txAdminVersion,
                            await getOsDistro(),
                            contextVariables.$step
                        ]);
                }
                this.customLogError(msg);
                return await this.markFailedDeploy();
            }
        }

        //Set progress
        this.progress = 100;
        this.customLog('All tasks completed.');

        //Check deploy folder validity (resources + server.cfg)
        try {
            if (!fse.existsSync(path.join(this.deployPath, 'resources'))) {
                throw new Error('this recipe didn\'t create a \'resources\' folder.');
            } else if (!fse.existsSync(path.join(this.deployPath, 'server.cfg'))) {
                throw new Error('this recipe didn\'t create a \'server.cfg\' file.');
            }
        } catch (error) {
            this.customLogError(`Deploy validation error: ${error.message}`);
            return await this.markFailedDeploy();
        }

        //Replace all vars in the server.cfg
        try {
            const task = {
                mode: 'all_vars',
                file: './server.cfg',
            };
            await recipeEngine['replace_string'].run(task, this.deployPath, contextVariables);
            this.customLog('Replacing all vars in server.cfg... ✔️');
        } catch (error) {
            this.customLogError(`Failed to replace all vars in server.cfg: ${error.message}`);
            return await this.markFailedDeploy();
        }

        //Else: success :)
        this.customLog('Deploy finished and folder validated. All done!');
        this.step = 'configure';
        if (txEnv.isWindows) {
            try {
                await open(path.normalize(this.deployPath), { app: 'explorer' });
            } catch (error) { }
        }
    }
}
