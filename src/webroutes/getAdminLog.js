//Requires
const xss = require("xss");
const prettyBytes = require('pretty-bytes');
const prettyMs = require('pretty-ms');
const pidusageTree = require('pidusage-tree');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const webUtils = require('./webUtils.js');
const context = 'WebServer:getAdminLog';


/**
 * Returns the output page containing the admin log.
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    let out = await globals.logger.get();
    return webUtils.sendOutput(res, out, {center:false});
};