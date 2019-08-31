//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../extras/console');
const webUtils = require('./../webUtils.js');
const context = 'WebServer:Auth-Get';

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };

/**
 * Gets the login page and destroys session if /auth?logout is defined
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    let message = '';
    if(!isUndefined(req.query.logout)){
        req.session.destroy();
        message = 'Logged Out';
    }
    let out = await webUtils.renderLoginView(message);
    return res.send(out);
};
