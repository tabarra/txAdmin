//Requires
const modulename = 'WebServer:CFGEditorSave';
const fs = require('fs-extra');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const helpers = require('../../extras/helpers');

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined'); };


/**
 * Saves the server.cfg
 * @param {object} ctx
 */
module.exports = async function CFGEditorSave(ctx) {
    //Sanity check
    if (
        isUndefined(ctx.request.body.cfgData)
        || typeof ctx.request.body.cfgData !== 'string'
    ) {
        return ctx.utils.error(400, 'Invalid Request');
    }

    //Check permissions
    if (!ctx.utils.checkPermission('server.cfg.editor', modulename)) {
        return ctx.send({
            type: 'danger',
            message: 'You don\'t have permission to execute this action.',
        });
    }

    //Check if file is set
    if (!globals.fxRunner.config.cfgPath || !globals.fxRunner.config.serverDataPath) {
        const message = 'CFG or Base Path not defined. Configure it in the settings page first.';
        return ctx.send({type: 'danger', message});
    }

    //Validating CFG Data
    try {
        const _port = helpers.getFXServerPort(ctx.request.body.cfgData);
    } catch (error) {
        return ctx.send({type: 'danger', message: `<strong>server.cfg error:</strong> <br>${error.message}`});
    }

    //Saving backup file
    const cfgFilePath = helpers.resolveCFGFilePath(globals.fxRunner.config.cfgPath, globals.fxRunner.config.serverDataPath);
    try {
        //NOTE: not moving to make sure we don't screw file permissions.
        await fs.writeFile(cfgFilePath + '.bkp', helpers.getCFGFileData(cfgFilePath), 'utf8');
    } catch (error) {
        const message = `Failed to save BackupCFG file with error: ${error.message}`;
        if (GlobalData.verbose) logWarn(message);
    }

    //Saving CFG file
    try {
        ctx.utils.logAction('Editing server CFG File.');
        await fs.writeFile(cfgFilePath, ctx.request.body.cfgData, 'utf8');
        return ctx.send({type: 'success', message: 'File saved.'});
    } catch (error) {
        const message = `Failed to save CFG file with error: ${error.message}`;
        if (GlobalData.verbose) logWarn(message);
        return ctx.send({type: 'danger', message});
    }
};
