//Requires
const fs = require('fs-extra');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../extras/console');
const webUtils = require('./../webUtils.js');
const helpers = require('../../extras/helpers');
const context = 'WebServer:CFGEditor-Save';

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };


/**
 * Saves the server.cfg
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    //Sanity check
    if(
        isUndefined(req.body.cfgData) ||
        typeof req.body.cfgData !== 'string'
    ){
        return res.status(400).send({status: 'error', message: "Invalid Request"});
    }

    //Check permissions
    if(!webUtils.checkPermission(req, 'server.cfg.editor', context)){
        return res.send({
            type: 'danger',
            message: `You don't have permission to execute this action.`
        });
    }

    //Check if file is set
    if(globals.fxRunner.config.cfgPath === null || globals.fxRunner.config.basePath === null){
        let message = `CFG or Base Path not defined. Configure it in the settings page first.`
        return res.send({type: 'danger', message});
    }

    //Saving CFG file
    let cfgFilePath = helpers.resolveCFGFilePath(globals.fxRunner.config.cfgPath, globals.fxRunner.config.basePath);
    try {
        globals.logger.append(`[${req.connection.remoteAddress}][${req.session.auth.username}] Editing server CFG File.`);
        await fs.writeFile(cfgFilePath, req.body.cfgData, 'utf8');
        return res.send({type: 'success', message: 'File saved.'});
    } catch (error) {
        let message = `Failed to save CFG file with error: ${error.message}`;
        if(globals.config.verbose) logWarn(message, context);
        return res.send({type: 'danger', message});
    }
};
