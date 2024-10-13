const modulename = 'WebServer:ServerLog';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);


/**
 * Returns the server log page
 * @param {object} ctx
 */
export default async function ServerLog(ctx) {
    //Check permissions
    if (!ctx.admin.hasPermission('server.log.view')) {
        return ctx.utils.render('main/message', { message: 'You don\'t have permission to view this page.' });
    }

    const renderData = {
        headerTitle: 'Server Log',
    };
    return ctx.utils.render('main/serverLog', renderData);
};
