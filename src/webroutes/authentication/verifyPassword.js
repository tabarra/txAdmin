//Requires
const modulename = 'WebServer:Auth-Verify';
const { dir, log, logOk, logWarn, logError} = require('../../extras/console')(modulename);

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
        let admin = globals.authenticator.getAdminByName(req.body.username);
        //Admin exists?
        if(!admin){
            logWarn(`Wrong username for from: ${req.connection.remoteAddress}`);
            message = 'Wrong Password!';
            let out = await webUtils.renderLoginView({message});
            return res.send(out);
        }
        //Does password match?
        if(!VerifyPasswordHash(req.body.password, admin.password_hash)){
            logWarn(`Wrong password for from: ${req.connection.remoteAddress}`);
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

        log(`Admin ${admin.name} logged in from ${req.connection.remoteAddress}`);
    } catch (error) {
        logWarn(`Failed to authenticate ${req.body.username} with error: ${error.message}`);
        message = 'Error autenticating admin.';
        let out = await webUtils.renderLoginView({message});
        return res.send(out);
    }

    return res.redirect('/');
};
