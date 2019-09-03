//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../extras/console');
const webUtils = require('./../webUtils.js');
const context = 'WebServer:Auth-Verify';

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };

/**
 * Verify login
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    if(isUndefined(req.body.username) || isUndefined(req.body.password)){
        req.redirect('/');
        return;
    }
    let message = '';

    let admin = globals.authenticator.checkAuth(req.body.username, req.body.password);
    if(!admin){
        logWarn(`Wrong password for from: ${req.connection.remoteAddress}`, context);
        message = 'Wrong Password!';
        let out = await webUtils.renderLoginView(message);
        return res.send(out);
    }
    req.session.auth = {
        username: admin.name,
        password: req.body.password,
        permissions: admin.permissions
    };
    log(`Admin ${admin.name} logged in from ${req.connection.remoteAddress}`, context);
    res.redirect('/');
};
