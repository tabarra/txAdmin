//Requires
const modulename = 'WebServer:ServerLog';
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);


/**
 * Returns the server log page
 * @param {object} ctx
 */
module.exports = async function ServerLog(ctx) {
    const renderData = {
        headerTitle: 'Server Log',
    };
    return ctx.utils.render('serverLog', renderData);
};
