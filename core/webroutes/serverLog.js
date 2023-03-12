const modulename = 'WebServer:ServerLog';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);


/**
 * Returns the server log page
 * @param {object} ctx
 */
export default async function ServerLog(ctx) {
    const renderData = {
        headerTitle: 'Server Log',
    };
    return ctx.utils.render('main/serverLog', renderData);
};
