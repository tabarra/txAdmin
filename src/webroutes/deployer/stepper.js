//Requires
const modulename = 'WebServer:DeployerStepper';
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);


/**
 * Returns the output page containing the live console
 * @param {object} ctx
 */
module.exports = async function DeployerStepper(ctx) {
    //Check permissions
    if(!ctx.utils.checkPermission('all_permissions', modulename)){
        return ctx.utils.render('basic/generic', {message: `You need to be the admin master to use the deployer.`});
    }

    //Check if this is the correct state for the deployer
    if(globals.deployer == null){
        const redirPath = (globals.fxRunner.config.serverDataPath === null || globals.fxRunner.config.cfgPath === null)? '/setup' : '/';
        return ctx.response.redirect(redirPath);
    }

    //DEBUG:
    const fs = require('fs');
    const tmpFilesPath = `${GlobalData.txAdminResourcePath}/src/webroutes/deployer`;

    //Prepare Output
    const renderData = {
        step: globals.deployer.step,
        serverProfile: globals.info.serverProfile,
    };
    if(globals.deployer.step === 'review'){
        renderData.recipe = {
            isTrustedSource: globals.deployer.isTrustedSource,
            name: globals.deployer.recipe.name,
            version: globals.deployer.recipe.version,
            author: globals.deployer.recipe.author,
            description: globals.deployer.recipe.description,
            raw: globals.deployer.recipe.raw,
        }

    }else if(globals.deployer.step === 'running'){
        renderData.deployPath = globals.deployer.deployPath;

    }else if(globals.deployer.step === 'configure'){
        renderData.serverCFG = fs.readFileSync(`${tmpFilesPath}/server.ignore.cfg`).toString().trim() //DEBUG

    }else{
        return ctx.utils.render('basic/generic', {message: `Unknown Deployer step, please report this bug and restart txAdmin.`});
    }

    return ctx.utils.render('basic/deployer', renderData);
};
