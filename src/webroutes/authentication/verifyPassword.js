//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../extras/console');
const webUtils = require('../webUtils.js');
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
        res.redirect('/');
        return;
    }
    let message = '';

    try {
        let admin = globals.authenticator.getAdminData(req.body.username);
        //Admin exists?
        if(!admin){
            logWarn(`Wrong username for from: ${req.connection.remoteAddress}`, context);
            message = 'Wrong Password!';
            let out = await webUtils.renderLoginView({message});
            return res.send(out);
        }
        //Can use password?
        if(typeof admin.password_hash !== 'string'){
            message = `This admin doesn't have a password saved!`;
            let out = await webUtils.renderLoginView({message});
            return res.send(out);
        }
        //Does password match?
        if(!VerifyPasswordHash(req.body.password, admin.password_hash)){
            logWarn(`Wrong password for from: ${req.connection.remoteAddress}`, context);
            message = 'Wrong Password!';
            let out = await webUtils.renderLoginView({message});
            return res.send(out);
        }

        //Setting up session
        req.session.auth = {
            username: admin.name,
            password_hash: admin.password_hash,
            expires_at: false
        };

        log(`Admin ${admin.name} logged in from ${req.connection.remoteAddress}`, context);
    } catch (error) {
        logWarn(`Failed to authenticate ${req.body.username} with error: ${error.message}`, context);
        message = 'Error autenticating admin.';
        let out = await webUtils.renderLoginView({message});
        return res.send(out);
    }

    return res.redirect('/');
};
