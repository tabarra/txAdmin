//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const webUtils = require('./webUtils.js');
const context = 'WebServer:getAdmins';


/**
 * Returns the output page containing the admins.
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    dir(req.body)
    return res.redirect('/adminManager');
};
