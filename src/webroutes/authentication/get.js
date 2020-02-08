//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../extras/console');
const context = 'WebServer:Auth-Get';

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };

/**
 * Gets the login page and destroys session if /auth?logout is defined
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    //Set template type
    let template = (globals.authenticator.admins === false)? 'noMaster' : 'normal';

    //Destroy session? And start a new one
    if(!isUndefined(req.query.logout)) req.session.auth = {};

    //Render page
    let renderData = {
        template,
        message: (!isUndefined(req.query.logout))? 'Logged Out' : '',
        citizenfxDisabled: !globals.authenticator.providers.citizenfx.ready,
        discordDisabled: true,
    }
    let out = await webUtils.renderLoginView(renderData);
    return res.send(out);
};
