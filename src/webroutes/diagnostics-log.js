//Requires
const dateFormat = require('dateformat');
const xssClass = require("xss");
const { dir, log, logOk, logWarn, logError, cleanTerminal, getLog } = require('../extras/console');
const webUtils = require('./webUtils.js');
const context = 'WebServer:Diagnostics-Log';

//Set custom xss rules
const xss = new xssClass.FilterXSS({
    whiteList: []
});


/**
 * Returns the output page containing the full report
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    const logHistory = getLog();

    let processedLog = [];
    logHistory.forEach(logData => {
        let ts = dateFormat(new Date(logData.ts*1000), 'HH:MM:ss');
        let mark = `<mark class="consoleMark-${logData.type.toLowerCase()}">[${ts}][${logData.ctx}]</mark>`;
        processedLog.push(`${mark}  ${xss.process(logData.msg)}`);
    });
    let out = await webUtils.renderMasterView('diagnostics-log', req.session, {log: processedLog.join('\n')});
    return res.send(out);
};
