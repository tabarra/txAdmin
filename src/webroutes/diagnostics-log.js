//Requires
const modulename = 'WebServer:DiagnosticsLog';
const dateFormat = require('dateformat');
const xssClass = require('xss');
const { dir, log, logOk, logWarn, logError, getLog } = require('../extras/console')(modulename);

//Set custom xss rules
const xss = new xssClass.FilterXSS({
    whiteList: []
});


/**
 * Returns the output page containing the full report
 * @param {object} ctx
 */
module.exports = async function DiagnosticsLog(ctx) {
    const logHistory = getLog();

    let processedLog = [];
    logHistory.forEach(logData => {
        let ts = dateFormat(new Date(logData.ts*1000), 'HH:MM:ss');
        let mark = `<mark class="consoleMark-${logData.type.toLowerCase()}">[${ts}][${logData.ctx}]</mark>`;
        processedLog.push(`${mark}  ${xss.process(logData.msg)}`);
    });
    return ctx.utils.render('diagnostics-log', {log: processedLog.join('\n')});
};
