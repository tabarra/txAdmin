//Requires
const modulename = 'WebServer:ProviderRedirect';
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };
const genCallbackURL = (ctx, provider) => {
    return ctx.protocol + '://' + ctx.get('host') + `/auth/${provider}/callback`
}
const returnJustMessage = async (ctx, message) => {
    return ctx.utils.render('login', {template: 'justMessage', message});
};

/**
 * Generates the provider auth url and redirects the user
 * @param {object} ctx
 */
module.exports = async function ProviderRedirect(ctx) {
    //Sanity check
    if(isUndefined(ctx.params.provider)){
        return ctx.utils.error(400, 'Invalid Request');
    }
    let provider = ctx.params.provider;

    //FIXME: generalize this to any provider
    if(provider !== 'citizenfx'){
        return returnJustMessage(ctx, 'Provider not implemented... yet');
    }

    //Make sure the session is initialized
    ctx.session.startedSocialLogin = Date.now();

    //Generatte CitizenFX provider Auth URL
    try {
        let urlCitizenFX =  await globals.authenticator.providers.citizenfx.getAuthURL(genCallbackURL(ctx, 'citizenfx'), ctx.session._sessCtx.externalKey);
        return ctx.response.redirect(urlCitizenFX);
    } catch (error) {
        if(GlobalData.verbose || true) logWarn(`Failed to generate CitizenFX Auth URL with error: ${error.message}`);
        return returnJustMessage(ctx, 'Failed to generate CitizenFX Auth URL');
    }
};
