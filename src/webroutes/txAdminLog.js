//Requires
const modulename = 'WebServer:txAdminLog';
const dateFormat = require('dateformat');
const xss = require('../extras/xss')();
const { dir, log, logOk, logWarn, logError, getLog } = require('../extras/console')(modulename);


/**
 * Returns the output page containing the action log, and the console log
 * @param {object} ctx
 */
module.exports = async function txAdminLog(ctx) {
    //Check permissions
    if (!ctx.utils.checkPermission('txadmin.log.view', modulename)) {
        return ctx.utils.render('basic/generic', {message: 'You don\'t have permission to view this page.'});
    }

    //Console
    const rawConsoleLog = getLog();
    const consoleLogLines = [];
    rawConsoleLog.forEach((logData) => {
        const ts = dateFormat(new Date(logData.ts * 1000), 'HH:MM:ss');
        const mark = `<mark class="consoleMark-${logData.type.toLowerCase()}">[${ts}][${logData.ctx}]</mark>`;
        consoleLogLines.push(`${mark}  ${xss(logData.msg)}`);
    });
    const consoleLog = consoleLogLines.join('\n');

    //Actions
    const actionLog = xss(await globals.logger.admin.getRecentBuffer());

    //Output
    return ctx.utils.render('txAdminLog', {headerTitle: 'txAdmin Log', consoleLog, actionLog});
};
