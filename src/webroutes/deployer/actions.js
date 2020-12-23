//Requires
const modulename = 'WebServer:DeployerActions';
const fs = require('fs-extra');
const path = require('path');
const cloneDeep = require('lodash/cloneDeep');
const slash = require('slash');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const helpers = require('../../extras/helpers');

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };

//FIXME: temporary fix for the yarn issue requiring fxchild.stdin writes
let yarnInputFix, yarnInputFixCounter;


/**
 * Handle all the server control actions
 * @param {object} ctx
 */
module.exports = async function DeployerActions(ctx) {
    //Sanity check
    if(isUndefined(ctx.params.action)){
        return ctx.utils.error(400, 'Invalid Request');
    }
    const action = ctx.params.action;

    //Check permissions
    if(!ctx.utils.checkPermission('master', modulename)){
        return ctx.send({success: false, refresh: true});
    }

    //Check if this is the correct state for the deployer
    if(globals.deployer == null){
        return ctx.send({success: false, refresh: true});
    }

    //Delegate to the specific action functions
    if(action == 'confirmRecipe'){
        return await handleConfirmRecipe(ctx);

    }else if(action == 'setVariables'){
        return await handleSetVariables(ctx);

    }else if(action == 'commit'){
        return await handleSaveConfig(ctx);

    }else if(action == 'cancel'){
        return await handleCancel(ctx);

    }else{
        return ctx.send({
            type: 'danger', 
            message: 'Unknown setup action.'
        });
    }
};


//================================================================
/**
 * Handle submition of user-edited recipe (record to deployer, starts the process)
 * @param {object} ctx
 */
async function handleConfirmRecipe(ctx) {
    //Sanity check
    if(isUndefined(ctx.request.body.recipe)){
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }
    const userEditedRecipe = ctx.request.body.recipe;

    try {
        ctx.utils.logAction(`Setting recipe.`);
        await globals.deployer.confirmRecipe(userEditedRecipe);
    } catch (error) {
        return ctx.send({type: 'danger', message: error.message});
    }

    return ctx.send({success: true});
}


//================================================================
/**
 * Handle submition of the input variables/parameters
 * @param {object} ctx
 */
async function handleSetVariables(ctx) {
    //Sanity check
    if(isUndefined(ctx.request.body.svLicense)){
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }
    const userVars = cloneDeep(ctx.request.body);

    //Setting iden
    if(typeof userVars.dbDelete !== 'undefined'){
        userVars.dbDelete = (userVars.dbDelete === 'true');
        userVars.dbConnectionString = (userVars.dbPassword.length)
            ? `mysql://${userVars.dbUsername}:${userVars.dbPassword}@${userVars.dbHost}/${userVars.dbName}?charset=utf8mb4`
            : `mysql://${userVars.dbUsername}@${userVars.dbHost}/${userVars.dbName}?charset=utf8mb4`;
    }

    //Setting identifiers array
    const admin = globals.authenticator.getAdminByName(ctx.session.auth.username);
    if(!admin) return ctx.send({type: 'danger', message: "Admin not found."});
    const addPrincipalLines = [];
    Object.keys(admin.providers).forEach(providerName => {
        if(admin.providers[providerName].identifier){
            addPrincipalLines.push(`add_principal identifier.${admin.providers[providerName].identifier} group.admin`);
        }
    });
    userVars.addPrincipalsMaster = (addPrincipalLines.length)
        ? addPrincipalLines.join('\n') 
        : `# Deployer Note: this admin master has no identifiers to be automatically added.`;

    //Start deployer
    try {
        ctx.utils.logAction(`Running recipe.`);
        globals.deployer.start(userVars)
    } catch (error) {
        return ctx.send({type: 'danger', message: error.message});
    }

    return ctx.send({success: true});
}


//================================================================
/**
 * Handle the commit of a Recipe by receiving the user edited server.cfg
 * @param {object} ctx
 */
async function handleSaveConfig(ctx) {
    //Sanity check
    if(isUndefined(ctx.request.body.serverCFG)){
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }
    const serverCFG = ctx.request.body.serverCFG;
    const cfgFilePath = path.join(globals.deployer.deployPath, 'server.cfg');

    //Saving backup file
    try {
        await fs.copy(cfgFilePath, `${cfgFilePath}.bkp`);
    } catch (error) {
        const message = `Failed to backup 'server.cfg' file with error: ${error.message}`;
        if(GlobalData.verbose) logWarn(message);
        return ctx.send({type: 'danger', message});
    }

    //Validating config contents
    try {
        const port = helpers.getFXServerPort(serverCFG);
    } catch (error) {
        return ctx.send({type: 'danger', message: `<strong>CFG File error:</strong> ${error.message}`});
    }

    //Saving CFG file
    try {
        await fs.writeFile(cfgFilePath, serverCFG, 'utf8');
        ctx.utils.logAction(`Configured server.cfg from deployer.`);
    } catch (error) {
        const message = `Failed to edit 'server.cfg' with error: ${error.message}`;
        if(GlobalData.verbose) logWarn(message);
        return ctx.send({type: 'danger', message});
    }

    //Preparing & saving config
    const newFXRunnerConfig = globals.configVault.getScopedStructure('fxRunner');
    newFXRunnerConfig.serverDataPath = slash(path.normalize(globals.deployer.deployPath));
    newFXRunnerConfig.cfgPath = slash(path.normalize(cfgFilePath));
    if(typeof globals.deployer.recipe.onesync !== 'undefined'){
        newFXRunnerConfig.onesync = globals.deployer.recipe.onesync;
    }
    const saveFXRunnerStatus = globals.configVault.saveProfile('fxRunner', newFXRunnerConfig);

    if(saveFXRunnerStatus){
        globals.fxRunner.refreshConfig();
        ctx.utils.logAction(`Completed and committed server deploy.`);

        //FIXME: temporary fix for the yarn issue requiring fxchild.stdin writes
        yarnInputFixCounter = 0;
        clearInterval(yarnInputFix);
        yarnInputFix = setInterval(() => {
            if(yarnInputFixCounter > 6){
                if(GlobalData.verbose) log('Clearing yarnInputFix setInterval');
                clearInterval(yarnInputFix);
            }
            yarnInputFixCounter++;
            try {
                globals.fxRunner.srvCmd(`txaPing temporary_yarn_workaround_please_ignore#${yarnInputFixCounter}`);
            } catch (error) {}
        }, 30*1000);

        //Starting server
        const spawnMsg = await globals.fxRunner.spawnServer(false);
        if(spawnMsg !== null){
            return ctx.send({type: 'danger', message: `Faied to start server with error: <br>\n${spawnMsg}`});
        }else{
            globals.deployer = null;
            return ctx.send({success: true});
        }
    }else{
        logWarn(`[${ctx.ip}][${ctx.session.auth.username}] Error changing fxserver settings via deployer.`);
        return ctx.send({type: 'danger', message: `<strong>Error saving the configuration file.</strong>`});
    }
}


//================================================================
/**
 * Handle the cancellation of the deployer proguess 
 * @param {object} ctx
 */
async function handleCancel(ctx) {
    globals.deployer = null;
    return ctx.send({success: true});  
}
