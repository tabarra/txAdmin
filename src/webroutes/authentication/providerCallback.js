//Requires
const modulename = 'WebServer:ProviderCallback';
const crypto  = require('crypto');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };
const returnJustMessage = (ctx, message) => {
    return ctx.utils.render('login', {template: 'justMessage', message});
};

/**
 * Handles the provider login callbacks
 * @param {object} ctx
 */
module.exports = async function ProviderCallback(ctx) {
    //Sanity check
    if(
        isUndefined(ctx.params.provider) ||
        isUndefined(ctx.query.state)
    ){
        return ctx.utils.error(400, 'Invalid Request');
    }
    let provider = ctx.params.provider;
    let reqState = ctx.query.state;

    //FIXME: generalize this to any provider
    if(provider !== 'citizenfx'){
        return returnJustMessage(ctx, 'Provider not implemented... yet');
    }

    //Check the state changed
    let stateSeed = `txAdmin:${ctx.session._sessCtx.externalKey}`;
    let stateExpected = crypto.createHash('SHA1').update(stateSeed).digest("hex");
    if(reqState != stateExpected){
        return returnJustMessage(ctx, 'This link has expired.');
    }

    //Exchange code for access token
    let tokenSet;
    try {
        let currentURL = ctx.protocol + '://' + ctx.get('host') + `/auth/${provider}/callback`;
        tokenSet = await globals.authenticator.providers.citizenfx.processCallback(ctx, currentURL, ctx.session._sessCtx.externalKey);
    } catch (error) {
        let message;
        if(!isUndefined(error.tolerance)){
            message = `Code Exchange error.\r\nPlease Update/Synchronize your VPS clock.`;
        }else{
            message = `Code Exchange error:\r\n${error.message}.`;
        }
        logWarn(`Code Exchange error: ${error.message}`);
        return returnJustMessage(ctx, message);
    }

    //Exchange code for access token
    let userInfo;
    try {
        userInfo = await globals.authenticator.providers.citizenfx.getUserInfo(tokenSet.access_token);
    } catch (error) {
        let message = `Get UserInfo error: ${error.message}`;
        if(GlobalData.verbose) logError(message);
        return returnJustMessage(ctx, message);
    }

/*
    let tokenSet = {
        "id_token": "sdfgdsfgdfsg",
        "access_token": "dfgdsfgsdfg",
        "expires_at": 1578863643,
        "token_type": "Bearer",
        "scope": "openid identify",
        "session_state": "jdfghdfghdfghdfghb613bfc71"
    }
    let userInfo = {
        "nameid": "https://forum.cfx.re/internal/user/271816",
        "name": "tabarra",
        "profile": "https://forum.cfx.re/u/tabarra",
        "picture": "https://forum.cfx.re/user_avatar/forum.cfx.re/tabarra/256/198232_2.png",
        "sub": "3777caekhg2345khg2345h23g45jh23g45j23g452g52jhghj3g543jg546247a6de8868"
    }
*/

    //FIXME: check the sub claim?

    //Check & Login user
    try {
        let admin = globals.authenticator.getAdminByProviderUID(userInfo.name);
        if(!admin){
            ctx.session.auth = {};
            let message = `This account is not an admin.`;
            if(GlobalData.verbose) logWarn(message);
            return returnJustMessage(ctx, message);
        }

        //Setting session
        ctx.session.auth = await globals.authenticator.providers.citizenfx.getUserSession(tokenSet, userInfo);
        ctx.session.auth.username = admin.name;

        //TODO: refresh the provider data on the admins file

        log(`Admin ${admin.name} logged in from ${ctx.ip}`);
        return ctx.response.redirect('/');
    } catch (error) {
        ctx.session.auth = {};
        let message = `Failed to login: ${error.message}`;
        if(GlobalData.verbose) logError(message);
        return returnJustMessage(ctx, message);
    }
};
