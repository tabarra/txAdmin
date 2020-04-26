//Requires
const modulename = 'WebServer:CFGEditorGet';
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const helpers = require('../../extras/helpers');


/**
 * Returns the output page containing the server.cfg
 * @param {object} ctx
 */
module.exports = async function CFGEditorGet(ctx) {
    //Check permissions
    if(!ctx.utils.checkPermission('server.cfg.editor', modulename)){
        return ctx.utils.render('basic/generic', {message: `You don't have permission to view this page.`});
    }

    //Check if file is set
    if(globals.fxRunner.config.cfgPath === null){
        let message = `Your CFG Path is not set. Configure it in the settings page first.`
        return ctx.utils.render('basic/generic', {message});
    }

    //Read cfg file
    let rawFile;
    try {
        let cfgFilePath = helpers.resolveCFGFilePath(globals.fxRunner.config.cfgPath, globals.fxRunner.config.serverDataPath);
        rawFile = helpers.getCFGFileData(cfgFilePath);
    } catch (error) {
        let message = `Failed to read CFG File with error: ${error.message}`;
        return ctx.utils.render('basic/generic', {message});
    }

    return ctx.utils.render('cfgEditor', {rawFile});
};
