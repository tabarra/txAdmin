//Requires
const modulename = 'WebServer:ActionLog';
const { dir, log, logOk, logWarn, logError} = require('../extras/console')(modulename);


/**
 * Returns the output page containing the admin log.
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    let log = await globals.logger.get();
    let out = await webUtils.renderMasterView('actionLog', req.session, {headerTitle: 'Action Log', log});
    return res.send(out);
};
