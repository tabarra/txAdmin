//Requires
const modulename = 'WebServer:MasterActions:Get';
const path = require('path');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

/**
 * Handles the rendering or delivery of master action resources
 * @param {object} ctx
 */
module.exports = async function MasterActionsGet(ctx) {
    const isMasterAdmin = (ctx.utils.checkPermission('master', modulename, false));
    const disableActions = (isMasterAdmin && ctx.txVars.isWebInterface) ? '' : 'disabled';
    return ctx.utils.render('masterActions', {
        disableActions,
        isMasterAdmin,
        dbFilePathSuggestion: path.join(globals.fxRunner.config.serverDataPath, 'resources'),
    });
};
