//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../extras/console');
const webUtils = require('./../webUtils.js');
const context = 'WebServer:Auth-Get';

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };
const genCallbackURL = (req, provider) => {
    return req.protocol + '://' + req.get('host') + `/auth/${provider}/callback`
}

/**
 * Gets the login page and destroys session if /auth?logout is defined
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    //Set template type
    let template = (globals.authenticator.admins === false)? 'noMaster' : 'normal';

    //Destroy session?
    if(!isUndefined(req.query.logout)) req.session.destroy();

    //Generatte CitizenFX provider Auth URL
    let urlCitizenFX;
    try {
        urlCitizenFX =  await globals.authenticator.providers.citizenfx.getAuthURL(genCallbackURL(req, 'citizenfx'), req.sessionID);
    } catch (error) {
        if(globals.config.verbose) logWarn(`Failed to generate CitizenFX Auth URL with error: ${error.message}`, context);
        urlCitizenFX = false;
    }

    //Render page
    let renderData = {
        template,
        message: (!isUndefined(req.query.logout))? 'Logged Out' : '',
        urlCitizenFX,
        urlDiscord: false,
    }
    let out = await webUtils.renderLoginView(renderData);
    return res.send(out);
};
