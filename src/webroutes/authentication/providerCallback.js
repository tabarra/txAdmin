//Requires
const modulename = 'WebServer:ProviderCallback';
const crypto  = require('crypto');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };
const returnJustMessage = (ctx, errorTitle, errorMessage) => {
    return ctx.utils.render('login', {template: 'justMessage', errorTitle, errorMessage});
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
    const provider = ctx.params.provider;
    const reqState = ctx.query.state;

    //FIXME: generalize this to any provider
    if(provider !== 'citizenfx'){
        return returnJustMessage(ctx, 'Provider not implemented... yet');
    }

    //Check the state changed
    const stateSeed = `txAdmin:${ctx.session._sessCtx.externalKey}`;
    const stateExpected = crypto.createHash('SHA1').update(stateSeed).digest("hex");
    if(reqState != stateExpected){
        return returnJustMessage(
            ctx,
            'This link has expired.',
            'Please refresh the page and try again.'
        );
    }

    //Exchange code for access token
    let tokenSet;
    try {
        const currentURL = ctx.protocol + '://' + ctx.get('host') + `/auth/${provider}/callback`;
        tokenSet = await globals.authenticator.providers.citizenfx.processCallback(ctx, currentURL, ctx.session._sessCtx.externalKey);
    } catch (error) {
        logWarn(`Code Exchange error: ${error.message}`);
        if(!isUndefined(error.tolerance)){
            return returnJustMessage(
                ctx,
                `Please Update/Synchronize your VPS clock.`,
                `Failed to login because this host's time is wrong. Please make sure to synchronize it with the internet.`
            );
        }else{
            return returnJustMessage(ctx, `Code Exchange error:`, error.message);
        }
    }

    //Get userinfo
    let userInfo;
    try {
        userInfo = await globals.authenticator.providers.citizenfx.getUserInfo(tokenSet.access_token);
    } catch (error) {
        if(GlobalData.verbose) logError(`Get UserInfo error: ${error.message}`);
        return returnJustMessage(ctx, `Get UserInfo error:`, error.message);
    }

    //FIXME: check the sub claim?

    //Check & Login user
    try {
        const admin = globals.authenticator.getAdminByProviderUID(userInfo.name);
        if(!admin){
            ctx.session.auth = {};
            const message = `This account is not an admin.`;
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
        if(GlobalData.verbose) logError(`Failed to login: ${error.message}`);
        return returnJustMessage(ctx, `Failed to login:`, error.message);
    }
};
