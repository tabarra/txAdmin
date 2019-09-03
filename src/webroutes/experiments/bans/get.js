//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../../extras/console');
const webUtils = require('./../../webUtils.js');
const context = 'WebServer:Experiments-Bans-Get';


/**
 * Returns the output page containing the bans experiment
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    let out = await webUtils.renderMasterView('experiments/bans', req.session, {headerTitle: 'Bans', expEnabled: true});
    return res.send(out);
};
