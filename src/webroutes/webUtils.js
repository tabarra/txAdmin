//Requires
const Sqrl = require("squirrelly");
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');

/**
 * Render the output page and send result
 * FIXME: temporary FUNCTION
 * @param {object} res 
 * @param {string} msg 
 */
function sendOutput(res, msg){
    let html = Sqrl.renderFile('public/out.html', {msg: msg});
    return res.send(html);
}

/**
 * Append data to the log file
 * @param {object} req 
 * @param {string} data 
 */
function appendLog(req, data, context){
    log(`Executing ${data}`, context);
    globals.logger.append(`[${req.connection.remoteAddress}][${req.session.admin}] ${data}`);
}

module.exports = {
    sendOutput,
    appendLog,
}