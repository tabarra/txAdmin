//Requires
const modulename = 'WebServer:SetupGet';
const path = require('path');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const { engineVersion } = require('../../extras/deployer');

/**
 * Returns the output page containing the live console
 * @param {object} ctx
 */
module.exports = async function SetupGet(ctx) {
    //Check permissions
    if (!ctx.utils.checkPermission('master', modulename)) {
        return ctx.utils.render('basic/generic', {message: 'You need to be the admin master to use the setup page.'});
    }

    // Check if this is the correct state for the setup page
    if (globals.deployer !== null) {
        return ctx.response.redirect('/deployer');
    }
    if (globals.fxRunner.config.serverDataPath && globals.fxRunner.config.cfgPath) {
        return ctx.response.redirect('/');
    }

    const globalConfig = globals.configVault.getScopedStructure('global');
    const renderData = {
        headerTitle: 'Setup',
        isReset: (globalConfig.serverName !== null),
        deployerEngineVersion: engineVersion,
        serverProfile: globals.info.serverProfile,
        txDataPath: GlobalData.dataPath,
        isZapHosting: GlobalData.isZapHosting,
        windowsBatPath: null,
    };

    if (GlobalData.osType == 'windows') {
        const batFolder = path.resolve(GlobalData.fxServerPath, '..');
        renderData.windowsBatPath  = path.join(batFolder, `start_${GlobalData.fxServerVersion}_${globals.info.serverProfile}.bat`);
    }

    return ctx.utils.render('basic/setup', renderData);
};
