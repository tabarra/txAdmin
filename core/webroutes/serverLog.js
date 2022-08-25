const modulename = 'WebServer:ServerLog';
import logger from '@core/extras/console.js';
const { dir, log, logOk, logWarn, logError } = logger(modulename);


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
