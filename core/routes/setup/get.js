const modulename = 'WebServer:SetupGet';
import path from 'node:path';
import { convars, txEnv } from '@core/globalData';
import { engineVersion } from '../../extras/deployer';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);


/**
 * Returns the output page containing the live console
 * @param {object} ctx
 */
export default async function SetupGet(ctx) {
    //Check permissions
    if (!ctx.admin.hasPermission('master')) {
        return ctx.utils.render('main/message', {message: 'You need to be the admin master to use the setup page.'});
    }

    // Check if this is the correct state for the setup page
    if (globals.deployer !== null) {
        return ctx.utils.legacyNavigateToPage('/server/deployer');
    }
    if (globals.fxRunner.config.serverDataPath && globals.fxRunner.config.cfgPath) {
        return ctx.utils.legacyNavigateToPage('/');
    }

    const globalConfig = globals.configVault.getScopedStructure('global');
    const renderData = {
        headerTitle: 'Setup',
        isReset: (globalConfig.serverName !== null),
        deployerEngineVersion: engineVersion,
        serverProfile: globals.info.serverProfile,
        txDataPath: txEnv.dataPath,
        isZapHosting: convars.isZapHosting,
        windowsBatPath: null,
    };

    if (txEnv.isWindows) {
        const batFolder = path.resolve(txEnv.fxServerPath, '..');
        renderData.windowsBatPath  = path.join(batFolder, `start_${txEnv.fxServerVersion}_${globals.info.serverProfile}.bat`);
    }

    return ctx.utils.render('standalone/setup', renderData);
};
