//Requires
const fs = require('fs');
const xss = require("xss");
const helpers = require('../../extras/helpers');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../extras/console');
const webUtils = require('./../webUtils.js');
const context = 'WebServer:CFGEditor-Get';


/**
 * Returns the output page containing the server.cfg
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    //Check if file is set
    if(globals.fxRunner.config.cfgPath === null){
        let message = `Your CFG Path is not set. Configure it in the settings page first.`
        let out = await webUtils.renderMasterView('basic/generic', req.session, {message});
        return res.send(out);
    }

    //Read cfg file
    let rawFile;
    try {
        rawFile = helpers.getCFGFile(globals.fxRunner.config.cfgPath+'sdf', globals.fxRunner.config.basePath);
    } catch (error) {
        let message = `Failed to read CFG File with error: ${error.message}`;
        let out = await webUtils.renderMasterView('basic/generic', req.session, {message});
        return res.send(out);
    }

    //Give output
    //TODO: Yannick, edit from here
    let out = await webUtils.renderMasterView('basic/generic', req.session, {message : rawFile});
    return res.send(out);
};
