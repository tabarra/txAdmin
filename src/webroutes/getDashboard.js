//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const webUtils = require('./webUtils.js');
const context = 'WebServer:getDashboard';


/**
 * Returns the output page containing the Dashboard (index)
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    let out = await webUtils.renderMasterView('dashboard');
    return res.send(out);
};
