//Requires
const modulename = 'WebServer:SetupGet';
const path = require('path');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);


/**
 * Returns the output page containing the live console
 * @param {object} ctx
 */
module.exports = async function SetupGet(ctx) {
    //Check permissions
    if(!ctx.utils.checkPermission('settings.view', modulename)){
        return ctx.utils.render('basic/generic', {message: `You don't have permission to view this page.`});
    }

    // //If there is any FXServer configuration is missing
    // if(globals.fxRunner.config.serverDataPath === null || globals.fxRunner.config.cfgPath === null){
    //     return ctx.response.redirect('/setup');
    // }

    const renderData = {
        headerTitle: `Setup`,
        serverProfile: globals.info.serverProfile,
        txDataPath: GlobalData.dataPath,
    }

    if(GlobalData.osType == 'windows'){
        const batFolder = path.resolve(GlobalData.fxServerPath, '..');
        renderData.windowsBatPath  = path.join(batFolder, `start_${GlobalData.fxServerVersion}_${globals.info.serverProfile}.bat`);
    }

    return ctx.utils.render('basic/setup', renderData);
};
