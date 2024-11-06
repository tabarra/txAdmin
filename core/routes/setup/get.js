const modulename = 'WebServer:SetupGet';
import path from 'node:path';
import { convars, txEnv } from '@core/globalData';
import { RECIPE_DEPLOYER_VERSION } from '@core/deployer/index';
import consoleFactory from '@lib/console';
import { TxConfigState } from '@shared/enums';
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

    // Ensure correct state for the setup page
    if(txManager.configState === TxConfigState.Deployer) {
        return ctx.utils.legacyNavigateToPage('/server/deployer');
    } else if(txManager.configState !== TxConfigState.Setup) {
        return ctx.utils.legacyNavigateToPage('/');
    }

    const globalConfig = txCore.configVault.getScopedStructure('global');
    const renderData = {
        headerTitle: 'Setup',
        isReset: (globalConfig.serverName !== null),
        deployerEngineVersion: RECIPE_DEPLOYER_VERSION,
        serverProfile: txEnv.profile,
        txDataPath: txEnv.dataPath,
        isZapHosting: convars.isZapHosting,
        windowsBatPath: null,
    };

    if (txEnv.isWindows) {
        const batFolder = path.resolve(txEnv.fxServerPath, '..');
        renderData.windowsBatPath  = path.join(batFolder, `start_${txEnv.fxsVersion}_${txEnv.profile}.bat`);
    }

    return ctx.utils.render('standalone/setup', renderData);
};
