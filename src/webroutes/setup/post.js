//Requires
const modulename = 'WebServer:SetupPost';
const fs = require('fs');
const slash = require('slash');
const path = require('path');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const helpers = require('../../extras/helpers');

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };

const getDirectories = (source) => {
    return fs.readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
}
    
const getPotentialServerDataFolders = (source) => {
    try {
        return getDirectories(source)
            .filter(dirent => getDirectories(path.join(source, dirent)).includes('resources'))
            .map(dirent => slash(path.join(source, dirent))+'/')
    } catch (error) {
        if(GlobalData.verbose) logWarn(`Failed to find server data folder with message: ${error.message}`)
        return []
    }
}

/*
    NOTE: How forgiving are we:
        - Ignore trailing slashes, as well as fix backslashes
        - Check if its the parent folder
        - Check if its inside the parent folder
        - Check if its inside current folder
        - Check if it contains the string `/resources`, then if its the path up to that string
        - For the cfg file, we check if its `server.cfg` inside the Server Data Folder (most common case)

    FIXME: Also note that this entire file is a bit too messy, please clean it up a bit
*/

/**
 * Handle all the server control actions
 * @param {object} ctx
 */
module.exports = async function SetupPost(ctx) {
    //Sanity check
    if(isUndefined(ctx.params.action)){
        return ctx.utils.error(400, 'Invalid Request');
    }
    let action = ctx.params.action;

    //Check permissions
    if(!ctx.utils.checkPermission('all_permissions', modulename)){
        return ctx.send({
            success: false, 
            message: `You don't have permission to execute this action.`
        });
    }


    //Delegate to the specific action functions
    if(action == 'validateDataFolder'){
        return await handleValidateDataFolder(ctx);
    }else if(action == 'validateCFGFile'){
        return await handleValidateCFGFile(ctx);
    }else if(action == 'save'){
        return await handleSave(ctx);
    }else{
        return ctx.send({
            success: false, 
            message: 'Unknown setup action.'
        });
    }
};


//================================================================
/**
 * Handle Validation of Server Data Folder
 * @param {object} ctx
 */
async function handleValidateDataFolder(ctx) {
    //Sanity check
    if(
        isUndefined(ctx.request.body.dataFolder)
    ){
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    let dataFolderPath = slash(path.normalize(ctx.request.body.dataFolder.trim()+'/'));
    if(dataFolderPath.includes(' ')){
        return ctx.send({success: false, message: 'The path cannot contain spaces.'});
    }
    try {
        if(!fs.existsSync(path.join(dataFolderPath, 'resources'))){
            let recoveryTemplate = `The path provided is invalid. <br>
                But it looks like <code>{{attempt}}</code> is correct. <br>
                Do you want to use it instead?`;

            //Recovery if parent folder
            let attemptIsParent = path.join(dataFolderPath, '..');
            if(fs.existsSync(path.join(attemptIsParent, 'resources'))){
                let message = recoveryTemplate.replace('{{attempt}}', attemptIsParent);
                return ctx.send({success: false, message, suggestion: attemptIsParent});
            }

            //Recovery parent inside folder
            let attemptOutside = getPotentialServerDataFolders(path.join(dataFolderPath, '..'));
            if(attemptOutside.length >= 1){
                let message = recoveryTemplate.replace('{{attempt}}', attemptOutside[0]);
                return ctx.send({success: false, message, suggestion: attemptOutside[0]});
            }

            //Recovery if resources
            if(dataFolderPath.includes('/resources')){
                let attemptRes = dataFolderPath.split('/resources')[0];
                if(fs.existsSync(path.join(attemptRes, 'resources'))){
                    let message = recoveryTemplate.replace('{{attempt}}', attemptRes);
                    return ctx.send({success: false, message, suggestion: attemptRes});
                }
            }

            //Recovery subfolder
            let attemptInside = getPotentialServerDataFolders(dataFolderPath);
            if(attemptInside.length >= 1){
                let message = recoveryTemplate.replace('{{attempt}}', attemptInside[0]);
                return ctx.send({success: false, message, suggestion: attemptInside[0]});
            }

            //really invalid :(
            throw new Error("Couldn't locate or read a resources folder inside of the path provided.");

        }else{
            return ctx.send({success: true});
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
    if(
        isUndefined(ctx.request.body.dataFolder) ||
        isUndefined(ctx.request.body.cfgFile)
    ){
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    let dataFolderPath = slash(path.normalize(ctx.request.body.dataFolder.trim()));
    let cfgFilePath = slash(path.normalize(ctx.request.body.cfgFile.trim()));
    cfgFilePath = helpers.resolveCFGFilePath(cfgFilePath, dataFolderPath);
    if(cfgFilePath.includes(' ')){
        return ctx.send({success: false, message: 'The path cannot contain spaces.'});
    }

    // TODO: add option to download this:
    // https://raw.githubusercontent.com/citizenfx/fivem-docs/master/static/examples/config/server.cfg
    let rawCfgFile;
    try {
        rawCfgFile = helpers.getCFGFileData(cfgFilePath);
    } catch (error) {
        try {
            let attempt = path.join(dataFolderPath, 'server.cfg');
            dir(attempt)
            rawCfgFile = helpers.getCFGFileData(attempt);
            let message = `The path provided is invalid. <br>
                    But it looks like <code>${attempt}</code> is correct. <br>
                    Do you want to use it instead?`;
            return ctx.send({success: false, message, suggestion: attempt});
        } catch (error2) {}

        return ctx.send({success: false, message: error.message});
    }
    
    try {
        let port = helpers.getFXServerPort(rawCfgFile);
        return ctx.send({success: true});
    } catch (error) {
        let message = `The file path is correct, but: <br>\n ${error.message}.`;
        return ctx.send({success: false, message});
    }
}


//================================================================
/**
 * Handle Save settings
 * @param {object} ctx
 */
async function handleSave(ctx) {
    //Sanity check
    if(
        isUndefined(ctx.request.body.name) ||
        isUndefined(ctx.request.body.dataFolder) ||
        isUndefined(ctx.request.body.cfgFile)
    ){
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    //Prepare body input
    let cfg = {
        name: ctx.request.body.name.trim(),
        dataFolder: slash(path.normalize(ctx.request.body.dataFolder+'/')),
        cfgFile: slash(path.normalize(ctx.request.body.cfgFile))
    }

    //Validating path spaces
    if(
        cfg.dataFolder.includes(' ') ||
        cfg.cfgFile.includes(' ')
    ){
        return ctx.send({success: false, message: 'The paths cannot contain spaces.'});
    }

    //Validating Base Path
    try {
        if(!fs.existsSync(path.join(cfg.dataFolder, 'resources'))){
            throw new Error("Invalid path");
        }
    } catch (error) {
        return ctx.send({success: false, message: `<strong>Server Data Folder error:</strong> ${error.message}`});
    }

    //Validating CFG Path
    try {
        let cfgFilePath = helpers.resolveCFGFilePath(cfg.cfgFile, cfg.dataFolder);
        let rawCfgFile = helpers.getCFGFileData(cfgFilePath);
        let port = helpers.getFXServerPort(rawCfgFile);
    } catch (error) {
        return ctx.send({success: false, message: `<strong>CFG File error:</strong> ${error.message}`});
    }

    //Preparing & saving config
    let newGlobalConfig = globals.configVault.getScopedStructure('global');
    newGlobalConfig.serverName = cfg.name;
    let saveGlobalStatus = globals.configVault.saveProfile('global', newGlobalConfig);

    let newFXRunnerConfig = globals.configVault.getScopedStructure('fxRunner');
    newFXRunnerConfig.serverDataPath = cfg.dataFolder;
    newFXRunnerConfig.cfgPath = cfg.cfgFile;
    let saveFXRunnerStatus = globals.configVault.saveProfile('fxRunner', newFXRunnerConfig);
    

    //Sending output
    if(saveGlobalStatus && saveFXRunnerStatus){
        //Refreshing config
        globals.config = globals.configVault.getScoped('global');
        globals.fxRunner.refreshConfig();

        //Logging
        let logMessage = `[${ctx.ip}][${ctx.session.auth.username}] Changing global/fxserver settings via welcome stepper.`;
        logOk(logMessage);
        globals.logger.append(logMessage);

        //Starting server
        let spawnMsg = await globals.fxRunner.spawnServer(false);
        if(spawnMsg !== null){
            return ctx.send({success: false, message: `Faied to start server with error: <br>\n${spawnMsg}`});
        }else{
            return ctx.send({success: true});
        }
    }else{
        logWarn(`[${ctx.ip}][${ctx.session.auth.username}] Error changingglobal/fxserver settings via welcome stepper.`);
        return ctx.send({success: false, message: `<strong>Error saving the configuration file.</strong>`});
    }
}

