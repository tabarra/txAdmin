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


    const tmpRecipeMetadata = {
        version: 'v1.2.3',
        author: 'Toybarra',
        description: 'A full featured (8 jobs) and highly configurable yet lightweight ESX v2 base that can be easily extendable. \nPlease join our discord to know more: http://discord.gg/example',
    }

    const fs = require('fs');
    const tmpFilesPath = `${GlobalData.txAdminResourcePath}/src/webroutes/deployer`;
    const renderData = {
        step: `review`,
        // step: `run`,
        // step: `configure`,
        recipe: {
            name: 'PlumeESX2',
            editorsChoice: false,
            version: (tmpRecipeMetadata.version)? `(${tmpRecipeMetadata.version.trim()})` : '',
            author: (tmpRecipeMetadata.author)? `${tmpRecipeMetadata.author.trim()}` : '',
            description: (tmpRecipeMetadata.description)? tmpRecipeMetadata.description.trim() : '',
            raw: fs.readFileSync(`${tmpFilesPath}/recipe.ignore.yaml`).toString().trim(),
        },
        deployPath: `${GlobalData.dataPath}/plumeesx2.base/`,
        serverCFG: fs.readFileSync(`${tmpFilesPath}/server.ignore.cfg`).toString().trim(),
        serverProfile: globals.info.serverProfile,
    }
  

    return ctx.utils.render('basic/deployer', renderData);
};
