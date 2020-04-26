//Requires
const modulename = 'WebServer:CFGEditorSave';
const fs = require('fs-extra');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const helpers = require('../../extras/helpers');

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };


/**
 * Saves the server.cfg
 * @param {object} ctx
 */
module.exports = async function CFGEditorSave(ctx) {
    //Sanity check
    if(
        isUndefined(ctx.request.body.cfgData) ||
        typeof ctx.request.body.cfgData !== 'string'
    ){
        return ctx.utils.error(400, 'Invalid Request');
    }

    //Check permissions
    if(!ctx.utils.checkPermission('server.cfg.editor', modulename)){
        return ctx.send({
            type: 'danger',
            message: `You don't have permission to execute this action.`
        });
    }

    //Check if file is set
    if(globals.fxRunner.config.cfgPath === null || globals.fxRunner.config.serverDataPath === null){
        let message = `CFG or Base Path not defined. Configure it in the settings page first.`
        return ctx.send({type: 'danger', message});
    }

    //Saving backup file
    let cfgFilePath = helpers.resolveCFGFilePath(globals.fxRunner.config.cfgPath, globals.fxRunner.config.serverDataPath);
    try {
        //NOTE: not moving to make sure we don't screw file permissions.
        await fs.writeFile(cfgFilePath + '.bkp', helpers.getCFGFileData(cfgFilePath), 'utf8');
    } catch (error) {
        let message = `Failed to save BackupCFG file with error: ${error.message}`;
        if(GlobalData.verbose) logWarn(message);
    }

    //Saving CFG file
    try {
        globals.logger.append(`[${ctx.ip}][${ctx.session.auth.username}] Editing server CFG File.`);
        await fs.writeFile(cfgFilePath, ctx.request.body.cfgData, 'utf8');
        return ctx.send({type: 'success', message: 'File saved.'});
    } catch (error) {
        let message = `Failed to save CFG file with error: ${error.message}`;
        if(GlobalData.verbose) logWarn(message);
        return ctx.send({type: 'danger', message});
    }
};
