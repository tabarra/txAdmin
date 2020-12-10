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
    const renderData = {
        template: 'normal',
        message: null,
        citizenfxDisabled: !globals.authenticator.providers.citizenfx.ready,
        discordDisabled: true,
    }

    try {
        let admin = globals.authenticator.getAdminByName(ctx.request.body.username);
        //Admin exists?
        if(!admin){
            logWarn(`Wrong username for from: ${ctx.ip}`);
            renderData.message = 'Wrong Password!';
            return ctx.utils.render('login', renderData);
        }
        //Does password match?
        if(!VerifyPasswordHash(ctx.request.body.password, admin.password_hash)){
            logWarn(`Wrong password for from: ${ctx.ip}`);
            renderData.message = 'Wrong Password!';
            return ctx.utils.render('login', renderData);
        }

        //Setting up session
        ctx.session.auth = {
            username: admin.name,
            picture: Object.values(admin.providers).find(provider => provider.data && provider.data.picture).data.picture,
            password_hash: admin.password_hash,
            expires_at: false
        };

        log(`Admin ${admin.name} logged in from ${ctx.ip}`);
        globals.databus.txStatsData.loginOrigins[ctx.txVars.hostType]++;
        globals.databus.txStatsData.loginMethods.password++;
    } catch (error) {
        logWarn(`Failed to authenticate ${ctx.request.body.username} with error: ${error.message}`);
        renderData.message = 'Error autenticating admin.';
        return ctx.utils.render('login', renderData);
    }

    return ctx.response.redirect('/');
};
