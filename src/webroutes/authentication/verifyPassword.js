//Requires
const modulename = 'WebServer:AuthVerify';
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };

/**
 * Verify login
 * @param {object} ctx
 */
module.exports = async function AuthVerify(ctx) {
    if(isUndefined(ctx.request.body.username) || isUndefined(ctx.request.body.password)){
        return ctx.response.redirect('/');
    }
    let message = '';

    try {
        let admin = globals.authenticator.getAdminByName(ctx.request.body.username);
        //Admin exists?
        if(!admin){
            logWarn(`Wrong username for from: ${ctx.ip}`);
            message = 'Wrong Password!';
            return ctx.utils.render('login', {message});
        }
        //Does password match?
        if(!VerifyPasswordHash(ctx.request.body.password, admin.password_hash)){
            logWarn(`Wrong password for from: ${ctx.ip}`);
            message = 'Wrong Password!';
            return ctx.utils.render('login', {message});
        }

        //Setting up session
        ctx.session.auth = {
            username: admin.name,
            password_hash: admin.password_hash,
            expires_at: false
        };

        log(`Admin ${admin.name} logged in from ${ctx.ip}`);
    } catch (error) {
        logWarn(`Failed to authenticate ${ctx.request.body.username} with error: ${error.message}`);
        message = 'Error autenticating admin.';
        return ctx.utils.render('login', {message});
    }

    return ctx.response.redirect('/');
};
