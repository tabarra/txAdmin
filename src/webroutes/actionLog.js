//Requires
const modulename = 'WebServer:ActionLog';
const { dir, log, logOk, logWarn, logError} = require('../extras/console')(modulename);


/**
 * Returns the output page containing the admin log.
 * @param {object} ctx
 */
module.exports = async function ActionLog(ctx) {
    let log = await globals.logger.get();
    return ctx.utils.render('actionLog', {headerTitle: 'Action Log', log});
};
