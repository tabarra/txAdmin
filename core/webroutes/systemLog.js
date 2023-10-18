const modulename = 'WebServer:SystemLog';
import xssInstancer from '@core/extras/xss.js';
import consoleFactory, { getLogBuffer } from '@extras/console';
const console = consoleFactory(modulename);
const xss = xssInstancer();


/**
 * Returns the output page containing the action log, and the console log
 * @param {object} ctx
 */
export default async function SystemLog(ctx) {
    //Check permissions
    if (!ctx.admin.hasPermission('txadmin.log.view')) {
        return ctx.utils.render('main/message', { message: 'You don\'t have permission to view this page.' });
    }

    return ctx.utils.render('main/systemLog', {
        headerTitle: 'System Log',
        consoleLog: getLogBuffer(),
        actionLog: xss(await globals.logger.admin.getRecentBuffer()),
    });
};
