//Requires
const modulename = 'WebServer:SetupPost';
const fs = require('fs-extra');
const slash = require('slash');
const path = require('path');
const axios = require('axios');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const { Deployer, validateTargetPath, parseValidateRecipe } = require('../../extras/deployer');
const helpers = require('../../extras/helpers');

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined'); };

const getDirectories = (source) => {
    return fs.readdirSync(source, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);
};

const getPotentialServerDataFolders = (source) => {
    try {
        return getDirectories(source)
            .filter((dirent) => getDirectories(path.join(source, dirent)).includes('resources'))
            .map((dirent) => slash(path.join(source, dirent)) + '/');
    } catch (error) {
        if (GlobalData.verbose) logWarn(`Failed to find server data folder with message: ${error.message}`);
        return [];
    }
};

/*
    NOTE: How forgiving are we:
        - Ignore trailing slashes, as well as fix backslashes
        - Check if its the parent folder
        - Check if its inside the parent folder
        - Check if its inside current folder
        - Check if it contains the string `/resources`, then if its the path up to that string
        - Detect config as `server.cfg` or with wrong extensions inside the Server Data Folder

    FIXME: Also note that this entire file is a bit too messy, please clean it up a bit
*/

/**
 * Handle all the server control actions
 * @param {object} ctx
 */
module.exports = async function SetupPost(ctx) {
    //Sanity check
    if (isUndefined(ctx.params.action)) {
        return ctx.utils.error(400, 'Invalid Request');
    }
    const action = ctx.params.action;

    //Check permissions
    if (!ctx.utils.checkPermission('all_permissions', modulename)) {
        return ctx.send({
            success: false,
            message: 'You need to be the admin master to use the setup page.',
        });
    }

    //Check if this is the correct state for the setup page
    if (
        globals.deployer !== null
        || (globals.fxRunner.config.serverDataPath && globals.fxRunner.config.cfgPath)
    ) {
        return ctx.send({
            success: false,
            refresh: true,
        });
    }

    //Delegate to the specific action functions
    if (action == 'validateRecipeURL') {
        return await handleValidateRecipeURL(ctx);
    } else if (action == 'validateLocalDeployPath') {
        return await handleValidateLocalDeployPath(ctx);
    } else if (action == 'validateLocalDataFolder') {
        return await handleValidateLocalDataFolder(ctx);
    } else if (action == 'validateCFGFile') {
        return await handleValidateCFGFile(ctx);
    } else if (action == 'save' && ctx.request.body.type == 'popular') {
        return await handleSaveDeployerImport(ctx);
    } else if (action == 'save' && ctx.request.body.type == 'remote') {
        return await handleSaveDeployerImport(ctx);
    } else if (action == 'save' && ctx.request.body.type == 'custom') {
        return await handleSaveDeployerCustom(ctx);
    } else if (action == 'save' && ctx.request.body.type == 'local') {
        return await handleSaveLocal(ctx);
    } else {
        return ctx.send({
            success: false,
            message: 'Unknown setup action.',
        });
    }
};


//================================================================
/**
 * Handle Validation of a remote recipe/template URL
 * @param {object} ctx
 */
async function handleValidateRecipeURL(ctx) {
    //Sanity check
    if (isUndefined(ctx.request.body.recipeURL)) {
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }
    const recipeURL = ctx.request.body.recipeURL.trim();

    //Make request & validate recipe
    try {
        const res = await axios({
            url: recipeURL,
            method: 'get',
            responseEncoding: 'utf8',
            timeout: 4500,
        });
        if (typeof res.data !== 'string') throw new Error('This URL did not return a string.');
        const recipe = parseValidateRecipe(res.data);
        return ctx.send({success: true, name: recipe.name});
    } catch (error) {
        return ctx.send({success: false, message: `Recipe error: ${error.message}`});
    }
}


//================================================================
/**
 * Handle Validation of a remote recipe/template URL
 * @param {object} ctx
 */
async function handleValidateLocalDeployPath(ctx) {
    //Sanity check
    if (isUndefined(ctx.request.body.deployPath)) {
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }
    const deployPath = slash(path.normalize(ctx.request.body.deployPath.trim()));

    //Perform path checking
    try {
        return ctx.send({success: true, message: await validateTargetPath(deployPath)});
    } catch (error) {
        return ctx.send({success: false, message: error.message});
    }
}


//================================================================
/**
 * Handle Validation of Local (existing) Server Data Folder
 * @param {object} ctx
 */
async function handleValidateLocalDataFolder(ctx) {
    //Sanity check
    if (isUndefined(ctx.request.body.dataFolder)) {
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }
    const dataFolderPath = slash(path.normalize(ctx.request.body.dataFolder.trim() + '/'));

    try {
        if (!fs.existsSync(path.join(dataFolderPath, 'resources'))) {
            const recoveryTemplate = `The path provided is invalid. <br>
                But it looks like <code>{{attempt}}</code> is correct. <br>
                Do you want to use it instead?`;

            //Recovery if parent folder
            const attemptIsParent = path.join(dataFolderPath, '..');
            if (fs.existsSync(path.join(attemptIsParent, 'resources'))) {
                const message = recoveryTemplate.replace('{{attempt}}', attemptIsParent);
                return ctx.send({success: false, message, suggestion: attemptIsParent});
            }

            //Recovery parent inside folder
            const attemptOutside = getPotentialServerDataFolders(path.join(dataFolderPath, '..'));
            if (attemptOutside.length >= 1) {
                const message = recoveryTemplate.replace('{{attempt}}', attemptOutside[0]);
                return ctx.send({success: false, message, suggestion: attemptOutside[0]});
            }

            //Recovery if resources
            if (dataFolderPath.includes('/resources')) {
                const attemptRes = dataFolderPath.split('/resources')[0];
                if (fs.existsSync(path.join(attemptRes, 'resources'))) {
                    const message = recoveryTemplate.replace('{{attempt}}', attemptRes);
                    return ctx.send({success: false, message, suggestion: attemptRes});
                }
            }

            //Recovery subfolder
            const attemptInside = getPotentialServerDataFolders(dataFolderPath);
            if (attemptInside.length >= 1) {
                const message = recoveryTemplate.replace('{{attempt}}', attemptInside[0]);
                return ctx.send({success: false, message, suggestion: attemptInside[0]});
            }

            //really invalid :(
            throw new Error("Couldn't locate or read a resources folder inside of the path provided.");
        } else {
            return ctx.send({
                success: true,
                detectedConfig: helpers.findLikelyCFGPath(dataFolderPath),
            });
        }
    } catch (error) {
        return ctx.send({success: false, message: error.message});
    }
}


//================================================================
/**
 * Handle Validation of CFG File
 * @param {object} ctx
 */
async function handleValidateCFGFile(ctx) {
    //Sanity check
    if (
        isUndefined(ctx.request.body.dataFolder)
        || isUndefined(ctx.request.body.cfgFile)
    ) {
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    const dataFolderPath = slash(path.normalize(ctx.request.body.dataFolder.trim()));
    const cfgFilePathNormalized = slash(path.normalize(ctx.request.body.cfgFile.trim()));
    const cfgFilePath = helpers.resolveCFGFilePath(cfgFilePathNormalized, dataFolderPath);

    //Try to read file
    let rawCfgFile;
    try {
        rawCfgFile = helpers.getCFGFileData(cfgFilePath);
    } catch (error) {
        return ctx.send({success: false, message: error.message});
    }

    //Validate file
    try {
        helpers.getFXServerPort(rawCfgFile);
        return ctx.send({success: true});
    } catch (error) {
        const message = `The file path is correct, but: <br>\n ${error.message}.`;
        return ctx.send({success: false, message});
    }
}


//================================================================
/**
 * Handle Save settings for local server data imports
 * Actions: sets serverDataPath/cfgPath, starts the server, redirect to live console
 * @param {object} ctx
 */
async function handleSaveLocal(ctx) {
    //Sanity check
    if (
        isUndefined(ctx.request.body.name)
        || isUndefined(ctx.request.body.dataFolder)
        || isUndefined(ctx.request.body.cfgFile)
    ) {
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    //Prepare body input
    const cfg = {
        name: ctx.request.body.name.trim(),
        dataFolder: slash(path.normalize(ctx.request.body.dataFolder + '/')),
        cfgFile: slash(path.normalize(ctx.request.body.cfgFile)),
    };

    //Validating Base Path
    try {
        if (!fs.existsSync(path.join(cfg.dataFolder, 'resources'))) {
            throw new Error('Invalid path');
        }
    } catch (error) {
        return ctx.send({success: false, message: `<strong>Server Data Folder error:</strong> ${error.message}`});
    }

    //Validating CFG Path
    try {
        const cfgFilePath = helpers.resolveCFGFilePath(cfg.cfgFile, cfg.dataFolder);
        const rawCfgFile = helpers.getCFGFileData(cfgFilePath);
        const _port = helpers.getFXServerPort(rawCfgFile);
    } catch (error) {
        return ctx.send({success: false, message: `<strong>CFG File error:</strong> ${error.message}`});
    }

    //Preparing & saving config
    const newGlobalConfig = globals.configVault.getScopedStructure('global');
    newGlobalConfig.serverName = cfg.name;
    const saveGlobalStatus = globals.configVault.saveProfile('global', newGlobalConfig);

    const newFXRunnerConfig = globals.configVault.getScopedStructure('fxRunner');
    newFXRunnerConfig.serverDataPath = cfg.dataFolder;
    newFXRunnerConfig.cfgPath = cfg.cfgFile;
    const saveFXRunnerStatus = globals.configVault.saveProfile('fxRunner', newFXRunnerConfig);


    //Sending output
    if (saveGlobalStatus && saveFXRunnerStatus) {
        //Refreshing config
        globals.config = globals.configVault.getScoped('global');
        globals.fxRunner.refreshConfig();

        //Logging
        ctx.utils.logAction('Changing global/fxserver settings via setup stepper.');

        //Starting server
        const spawnMsg = await globals.fxRunner.spawnServer(false);
        if (spawnMsg !== null) {
            return ctx.send({success: false, message: `Faied to start server with error: <br>\n${spawnMsg}`});
        } else {
            return ctx.send({success: true});
        }
    } else {
        logWarn(`[${ctx.session.auth.username}] Error changing global/fxserver settings via setup stepper.`);
        return ctx.send({success: false, message: '<strong>Error saving the configuration file.</strong>'});
    }
}



//================================================================
/**
 * Handle Save settings for remote recipe importing
 * Actions: download recipe, globals.deployer = new Deployer(recipe)
 * @param {object} ctx
 */
async function handleSaveDeployerImport(ctx) {
    //Sanity check
    if (
        isUndefined(ctx.request.body.name)
        || isUndefined(ctx.request.body.isTrustedSource)
        || isUndefined(ctx.request.body.recipeURL)
        || isUndefined(ctx.request.body.targetPath)
        || isUndefined(ctx.request.body.deploymentID)
    ) {
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }
    const isTrustedSource = (ctx.request.body.isTrustedSource === 'true');
    const serverName = ctx.request.body.name.trim();
    const recipeURL = ctx.request.body.recipeURL.trim();
    const targetPath = slash(path.normalize(ctx.request.body.targetPath + '/'));
    const deploymentID = ctx.request.body.deploymentID;

    //Get recipe
    let recipeData;
    try {
        const res = await axios({
            url: recipeURL,
            method: 'get',
            responseEncoding: 'utf8',
            timeout: 4500,
        });
        if (typeof res.data !== 'string') throw new Error('This URL did not return a string.');
        recipeData = res.data;
    } catch (error) {
        return ctx.send({success: false, message: `Recipe download error: ${error.message}`});
    }

    //Start deployer (constructor will validate the recipe)
    try {
        globals.deployer = new Deployer(recipeData, deploymentID, targetPath, isTrustedSource, {serverName});
    } catch (error) {
        return ctx.send({success: false, message: error.message});
    }

    //Preparing & saving config
    const newGlobalConfig = globals.configVault.getScopedStructure('global');
    newGlobalConfig.serverName = serverName;
    const saveGlobalStatus = globals.configVault.saveProfile('global', newGlobalConfig);

    //Checking save and redirecting
    if (saveGlobalStatus) {
        globals.config = globals.configVault.getScoped('global');
        ctx.utils.logAction('Changing global settings via setup stepper and started Deployer.');
        return ctx.send({success: true});
    } else {
        logWarn(`[${ctx.session.auth.username}] Error changing global settings via setup stepper.`);
        return ctx.send({success: false, message: '<strong>Error saving the configuration file.</strong>'});
    }
}


//================================================================
/**
 * Handle Save settings for custom recipe
 * Actions: download recipe, globals.deployer = new Deployer(recipe)
 * @param {object} ctx
 */
async function handleSaveDeployerCustom(ctx) {
    //Sanity check
    if (
        isUndefined(ctx.request.body.name)
        || isUndefined(ctx.request.body.targetPath)
        || isUndefined(ctx.request.body.deploymentID)
    ) {
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }
    const serverName = ctx.request.body.name.trim();
    const targetPath = slash(path.normalize(ctx.request.body.targetPath + '/'));
    const deploymentID = ctx.request.body.deploymentID;
    const customMetaData = {
        author: ctx.session.auth.username,
        serverName,
    };

    //Start deployer (constructor will create the recipe template)
    try {
        globals.deployer = new Deployer(false, deploymentID, targetPath, false, customMetaData);
    } catch (error) {
        return ctx.send({success: false, message: error.message});
    }

    //Preparing & saving config
    const newGlobalConfig = globals.configVault.getScopedStructure('global');
    newGlobalConfig.serverName = serverName;
    const saveGlobalStatus = globals.configVault.saveProfile('global', newGlobalConfig);

    //Checking save and redirecting
    if (saveGlobalStatus) {
        globals.config = globals.configVault.getScoped('global');
        ctx.utils.logAction('Changing global settings via setup stepper and started Deployer.');
        return ctx.send({success: true});
    } else {
        logWarn(`[${ctx.session.auth.username}] Error changing global settings via setup stepper.`);
        return ctx.send({success: false, message: '<strong>Error saving the configuration file.</strong>'});
    }
}

