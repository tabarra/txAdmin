//Requires
const fs = require('fs-extra');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../extras/console');
const webUtils = require('./../webUtils.js');
const context = 'WebServer:CFGEditor-Save';

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };


/**
 * Saves the server.cfg
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    // Sanity check
    if(isUndefined(req.body.data) || typeof req.body.data !== 'string') {
        return res.status(400).send({status: 'error', message: "Invalid Request"});
    }

    // Check permissions
    if(!webUtils.checkPermission(req, 'files.all', context) || !webUtils.checkPermission(req, 'files.edit', context) && !webUtils.checkPermission(req, 'files.all', context)) {
        return res.send({
            type: 'danger',
            message: `You don't have permission to execute this action.`
        });
    }

    // Check if file is set
    if (globals.fxRunner.config.basePath === null) {
        let message = `Base Path is not set. Configure it in the settings page first.`
        return res.send({type: 'danger', message});
    }

    // Saving File
    let filePath = req.originalUrl.length > 12 ? req.originalUrl.substring(12) : '/';
    let basePath = globals.configVault.configFile.fxRunner.basePath + filePath;

    try {
        globals.logger.append(`[${req.connection.remoteAddress}][${req.session.auth.username}] Editing File ${filePath}.`);
        await fs.writeFile(basePath, req.body.data, 'utf8');
        return res.send({type: 'success', message: 'File saved.'});
    } catch (error) {
        let message = `Failed to save CFG file with error: ${error.message}`;
        if(globals.config.verbose) logWarn(message, context);
        return res.send({type: 'danger', message});
    }
};
