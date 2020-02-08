//Requires
const modulename = 'WebServer:ProviderRedirect';
const { dir, log, logOk, logWarn, logError} = require('../../extras/console')(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };
const genCallbackURL = (req, provider) => {
    return req.protocol + '://' + req.get('host') + `/auth/${provider}/callback`
}
const returnJustMessage = async (res, message) => {
    let out = await webUtils.renderLoginView({template: 'justMessage', message});
    return res.send(out);
};

/**
 * Generates the provider auth url and redirects the user
 * @param {object} res
 * @param {object} req
 */
module.exports = async function ProviderRedirect(ctx) {
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

    //Generatte CitizenFX provider Auth URL
    try {
        let urlCitizenFX =  await globals.authenticator.providers.citizenfx.getAuthURL(genCallbackURL(req, 'citizenfx'), req.sessionID);
        return res.redirect(urlCitizenFX);
    } catch (error) {
        if(globals.config.verbose || true) logWarn(`Failed to generate CitizenFX Auth URL with error: ${error.message}`);
        return await returnJustMessage(res, 'Failed to generate CitizenFX Auth URL');
    }
};
