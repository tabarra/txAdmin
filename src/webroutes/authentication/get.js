//Requires
const modulename = 'WebServer:AuthGet';
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);


//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };

/**
 * Gets the login page and destroys session if /auth?logout is defined
 * @param {object} ctx
 */
module.exports = async function AuthGet(ctx) {
    //Set template type
    let template = (globals.authenticator.admins === false)? 'noMaster' : 'normal';

    //Destroy session? And start a new one
    if(!isUndefined(ctx.query.logout)) ctx.session.auth = {};

    //Render page
    let renderData = {
        template,
        message: (!isUndefined(ctx.query.logout))? 'Logged Out' : '',
        citizenfxDisabled: !globals.authenticator.providers.citizenfx.ready,
        discordDisabled: true,
    }
    return ctx.utils.render('login', renderData);
};
