//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../extras/console');
const webUtils = require('./../webUtils.js');
const context = 'WebServer:AddMaster';

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };

/**
 * Handles the Add Master flow
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    //Sanity check
    if(isUndefined(req.params.action)){
        res.status(400).send({status: 'error', error: "Invalid Request"});
        return;
    }
    let action = req.params.action;

    //Check if there are no master admins set up
    if(globals.authenticator.admins !== false){
        let message = `Master account already set.`;
        let out = await webUtils.renderLoginView({template: 'justMessage', message});
        return res.send(out);
    }

    //Delegate to the specific action handler
    if(action == 'pin'){
        return await handlePin(res, req);
    }else if(action == 'callback'){
        return await handleCallback(res, req);
    }else if(action == 'save'){
        return await handleSave(res, req);
    }else{
        return res.send({
            type: 'danger',
            message: 'Unknown action.'
        });
    }
};


//================================================================
/**
 * Handle Pin
 * @param {object} res
 * @param {object} req
 */
async function handlePin(res, req) {
    //Sanity check
    if(
        isUndefined(req.body.pin) ||
        typeof req.body.pin !== 'string' ||
        req.method != 'POST'
    ){
        return res.status(400).send({status: 'error', message: "Invalid Request - missing parameters"});
    }

    //Checking the PIN
    //HACK: enable this shit!!!!!!
    // if(req.body.pin !== globals.authenticator.addMasterPin){
    //     logWarn(`Wrong PIN for from: ${req.connection.remoteAddress}`, context);
    //     let message = `Wrong PIN.`;
    //     let out = await webUtils.renderLoginView({template: 'noMaster', message});
    //     return res.send(out);
    // }

    //Generate URL
    try {
        let callback = req.protocol + '://' + req.get('host') + `/auth/addMaster/callback`;
        let url = await globals.authenticator.providers.citizenfx.getAuthURL(callback, req.sessionID);
        // return res.send(`<a href="${url}">${url}</a>`);
        return res.redirect(url);
    } catch (error) {
        let message = `Failed to generate Provider Auth URL with error: ${error.message}`;
        let out = await webUtils.renderLoginView({template: 'justMessage', message});
        return res.send(out);
    }
}


//================================================================
/**
 * Handle Callback
 * @param {object} res
 * @param {object} req
 */
async function handleCallback(res, req) {
    //Sanity check
    if(req.method != 'GET'){
        return res.status(400).send({status: 'error', message: "Invalid Request - missing parameters"});
    }

    //Exchange code for access token
    let tokenSet;
    try {
        let currentURL = req.protocol + '://' + req.get('host') + `/auth/addMaster/callback`;
        tokenSet = await globals.authenticator.providers.citizenfx.processCallback(req, currentURL, req.sessionID);
    } catch (error) {
        let message = `Code Exchange error: ${error.message}`;
        logError(message, context);
        let out = await webUtils.renderLoginView({template: 'justMessage', message});
        return res.send(out);
    }

    //Exchange code for access token
    let userInfo;
    try {
        userInfo = await globals.authenticator.providers.citizenfx.getUserInfo(tokenSet.access_token);
    } catch (error) {
        let message = `Get UserInfo error: ${error.message}`;
        logError(message, context);
        let out = await webUtils.renderLoginView({template: 'justMessage', message});
        return res.send(out);
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

    // Setar userinfo na sessão
    req.session.tmpAddMasterTokenSet = tokenSet;
    req.session.tmpAddMasterUserInfo = userInfo;

    let renderData = {
        template: 'callback',
        addMaster_name: userInfo.name,
        addMaster_picture: userInfo.picture
    }
    let out = await webUtils.renderLoginView(renderData);
    return res.send(out);
}


//================================================================
/**
 * Handle Save
 * @param {object} res
 * @param {object} req
 */
async function handleSave(res, req) {
    //Sanity check
    if(
        typeof req.body.password !== 'string' ||
        typeof req.body.password2 !== 'string'
    ){
        return res.status(400).send({type: 'danger', message: "Invalid Request - missing parameters"});
    }

    //Sanity check2: Electric Boogaloo (Validating password)
    let password = req.body.password.trim();
    let password2 = req.body.password2.trim();
    if(password != password2 || password.length < 6 || password.length > 24){
        let message = `Invalid Password.`;
        let out = await webUtils.renderLoginView({template: 'justMessage', message});
        return res.send(out);
    }

    //Checking if session is still present
    if(
        typeof req.session.tmpAddMasterUserInfo === 'undefined' ||
        typeof req.session.tmpAddMasterUserInfo.name !== 'string' ||
        typeof req.session.tmpAddMasterUserInfo.picture !== 'string'
    ){
        let message = `Invalid Session.`;
        let out = await webUtils.renderLoginView({template: 'justMessage', message});
        return res.send(out);
    }

    //Creating admins file
    try {
        await globals.authenticator.createAdminsFile(req.session.tmpAddMasterUserInfo.name, req.session.tmpAddMasterUserInfo, password);
    } catch (error) {
        let out = await webUtils.renderLoginView({template: 'justMessage', message: error.message});
        return res.send(out);
    }

    //Login user
    try {
        req.session.auth = await globals.authenticator.providers.citizenfx.getUserSession(
            req.session.tmpAddMasterTokenSet,
            req.session.tmpAddMasterUserInfo
        );
        req.session.auth.master = true;
        delete req.session.tmpAddMasterTokenSet;
        delete req.session.tmpAddMasterUserInfo;
    } catch (error) {
        req.session.auth = {};
        let message = `Failed to login:<br> ${error.message}`;
        logError(message, context);
        let out = await webUtils.renderLoginView({template: 'justMessage', message});
        return res.send(out);
    }

    log('Admin file created! You can now login normally.', context);
    return res.redirect('/');
}
