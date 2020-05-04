//Requires
const modulename = 'WebServer:AddMaster';
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };

/**
 * Handles the Add Master flow
 * @param {object} ctx
 */
module.exports = async function AddMaster(ctx) {
    //Sanity check
    if(isUndefined(ctx.params.action)){
        return ctx.utils.error(400, 'Invalid Request');
    }
    let action = ctx.params.action;

    //Check if there are no master admins set up
    if(globals.authenticator.admins !== false){
        let message = `Master account already set.`;
        return ctx.utils.render('login', {template: 'justMessage', message});
    }

    //Delegate to the specific action handler
    if(action == 'pin'){
        return await handlePin(ctx);
    }else if(action == 'callback'){
        return await handleCallback(ctx);
    }else if(action == 'save'){
        return await handleSave(ctx);
    }else{
        return ctx.send({
            type: 'danger',
            message: 'Unknown action.'
        });
    }
};


//================================================================
/**
 * Handle Pin
 * @param {object} ctx
 */
async function handlePin(ctx) {
    //Sanity check
    if(
        isUndefined(ctx.request.body.pin) ||
        typeof ctx.request.body.pin !== 'string' ||
        ctx.method != 'POST'
    ){
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    //Checking the PIN
    if(ctx.request.body.pin !== globals.authenticator.addMasterPin){
        logWarn(`Wrong PIN for from: ${ctx.ip}`);
        let message = `Wrong PIN.`;
        return ctx.utils.render('login', {template: 'noMaster', message});
    }

    //Make sure the session is initialized
    ctx.session.startedSocialLogin = Date.now();

    //Generate URL
    try {
        let callback = ctx.protocol + '://' + ctx.get('host') + `/auth/addMaster/callback`;
        let url = await globals.authenticator.providers.citizenfx.getAuthURL(callback, ctx.session._sessCtx.externalKey);
        return ctx.response.redirect(url);
    } catch (error) {
        let message = `Failed to generate Provider Auth URL with error: ${error.message}`;
        return ctx.utils.render('login', {template: 'justMessage', message});
    }
}


//================================================================
/**
 * Handle Callback
 * @param {object} ctx
 */
async function handleCallback(ctx) {
    //Sanity check
    if(ctx.method != 'GET'){
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    //Exchange code for access token
    let tokenSet;
    try {
        let currentURL = ctx.protocol + '://' + ctx.get('host') + `/auth/addMaster/callback`;
        tokenSet = await globals.authenticator.providers.citizenfx.processCallback(ctx, currentURL, ctx.session._sessCtx.externalKey);
    } catch (error) {
        let message;
        if(!isUndefined(error.tolerance)){
            message = `Code Exchange error.\r\nPlease Update/Synchronize your VPS clock.`;
        }else{
            message = `Code Exchange error:\r\n${error.message}.`;
        }
        logWarn(`Code Exchange error: ${error.message}`);
        return ctx.utils.render('login', {template: 'justMessage', message});
    }

    //Exchange code for access token
    let userInfo;
    try {
        userInfo = await globals.authenticator.providers.citizenfx.getUserInfo(tokenSet.access_token);
    } catch (error) {
        let message = `Get UserInfo error: ${error.message}`;
        logError(message);
        return ctx.utils.render('login', {template: 'justMessage', message});
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
    ctx.session.tmpAddMasterTokenSet = tokenSet;
    ctx.session.tmpAddMasterUserInfo = userInfo;

    let renderData = {
        template: 'callback',
        addMaster_name: userInfo.name,
        addMaster_picture: userInfo.picture
    }
    return ctx.utils.render('login', renderData);
}


//================================================================
/**
 * Handle Save
 * @param {object} ctx
 */
async function handleSave(ctx) {
    //Sanity check
    if(
        typeof ctx.request.body.password !== 'string' ||
        typeof ctx.request.body.password2 !== 'string'
    ){
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    //Sanity check2: Electric Boogaloo (Validating password)
    let password = ctx.request.body.password.trim();
    let password2 = ctx.request.body.password2.trim();
    if(password != password2 || password.length < 6 || password.length > 24){
        let message = `Invalid Password.`;
        return ctx.utils.render('login', {template: 'justMessage', message});
    }

    //Checking if session is still present
    if(
        typeof ctx.session.tmpAddMasterUserInfo === 'undefined' ||
        typeof ctx.session.tmpAddMasterUserInfo.name !== 'string' ||
        typeof ctx.session.tmpAddMasterUserInfo.picture !== 'string'
    ){
        let message = `Invalid Session.`;
        return ctx.utils.render('login', {template: 'justMessage', message});
    }

    //Creating admins file
    try {
        await globals.authenticator.createAdminsFile(ctx.session.tmpAddMasterUserInfo.name, ctx.session.tmpAddMasterUserInfo, password);
    } catch (error) {
        return ctx.utils.render('login', {template: 'justMessage', message: error.message});
    }

    //Login user
    try {
        ctx.session.auth = await globals.authenticator.providers.citizenfx.getUserSession(
            ctx.session.tmpAddMasterTokenSet,
            ctx.session.tmpAddMasterUserInfo
        );
        ctx.session.auth.username = ctx.session.tmpAddMasterUserInfo.name
        delete ctx.session.tmpAddMasterTokenSet;
        delete ctx.session.tmpAddMasterUserInfo;
    } catch (error) {
        ctx.session.auth = {};
        let message = `Failed to login:<br> ${error.message}`;
        logError(message);
        return ctx.utils.render('login', {template: 'justMessage', message});
    }

    log('Admin file created! You can now login normally.');
    return ctx.response.redirect('/');
}
