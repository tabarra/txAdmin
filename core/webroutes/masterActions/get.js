const modulename = 'WebServer:MasterActions:Get';
import path from 'path';
import logger from '@core/extras/console.js';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

/**
 * Handles the rendering or delivery of master action resources
 * @param {object} ctx
 */
export default async function MasterActionsGet(ctx) {
    const isMasterAdmin = (ctx.utils.checkPermission('master', modulename, false));
    const disableActions = (isMasterAdmin && ctx.txVars.isWebInterface) ? '' : 'disabled';
    return ctx.utils.render('main/masterActions', {
        headerTitle: 'Master Actions',
        disableActions,
        isMasterAdmin,
        dbFilePathSuggestion: globals.fxRunner.config.serverDataPath
            ? path.join(globals.fxRunner.config.serverDataPath, 'resources')
            : '',
    });
};
