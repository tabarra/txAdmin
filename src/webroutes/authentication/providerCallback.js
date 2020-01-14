//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../extras/console');
const webUtils = require('./../webUtils.js');
const context = 'WebServer:ProviderCallback';

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };
const returnJustMessage = async (res, message) => {
    let out = await webUtils.renderLoginView({template: 'justMessage', message});
    return res.send(out);
};

/**
 * Handles the provider login callbacks
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    //Sanity check
    if(isUndefined(req.params.provider)){
        res.status(400).send({status: 'error', error: "Invalid Request"});
        return;
    }
    let provider = req.params.provider;

    //FIXME: generalize this to any provider
    if(provider !== 'citizenfx'){
        return await returnJustMessage(res, 'Provider not implemented... yet');
    }

    //Exchange code for access token
    let tokenSet;
    try {
        let currentURL = req.protocol + '://' + req.get('host') + `/auth/${provider}/callback`;
        tokenSet = await globals.authenticator.providers.citizenfx.processCallback(req, currentURL, req.sessionID);
    } catch (error) {
        let message = `Code Exchange error: ${error.message}`;
        if(globals.config.verbose) logError(message, context);
        return await returnJustMessage(res, message);
    }

    //Exchange code for access token
    let userInfo;
    try {
        userInfo = await globals.authenticator.providers.citizenfx.getUserInfo(tokenSet.access_token);
    } catch (error) {
        let message = `Get UserInfo error: ${error.message}`;
        if(globals.config.verbose) logError(message, context);
        return await returnJustMessage(res, message);
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

    //Check & Login user
    try {
        let admin = globals.authenticator.getAdminData(userInfo.name);
        if(!admin){
            req.session.destroy();
            let message = `This account is not an admin.`;
            if(globals.config.verbose) logWarn(message, context);
            return await returnJustMessage(res, message);
        }

        //Setting session
        req.session.auth = await globals.authenticator.providers.citizenfx.getUserSession(tokenSet, userInfo);
        req.session.auth.master = admin.master;
        req.session.auth.permissions = admin.permissions;
        dir(req.session.auth)

        log(`Admin ${admin.name} logged in from ${req.connection.remoteAddress}`, context);
        return res.redirect('/');
    } catch (error) {
        req.session.destroy();
        let message = `Failed to login: ${error.message}`;
        if(globals.config.verbose) logError(message, context);
        return await returnJustMessage(res, message);
    }
};
