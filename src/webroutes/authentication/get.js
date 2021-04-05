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
    const template = (globals.authenticator.admins === false)? 'noMaster' : 'normal';

    //Destroy session? And start a new one
    if(!isUndefined(ctx.query.logout)) ctx.session.auth = {};

    //If admins file was deleted
    if(Array.isArray(globals.authenticator.admins) && !globals.authenticator.admins.length){
        return ctx.utils.render('login', {
            template: 'justMessage', 
            errorTitle: 'No admins configured.', 
            errorMessage: 'This likely means that you moved or deleted the admins.json file. Please restart txAdmin to configure a new master account.'
        });
    }

    //Render page
    const renderData = {
        template,
        message: (!isUndefined(ctx.query.logout))? 'Logged Out' : '',
        citizenfxDisabled: !globals.authenticator.providers.citizenfx.ready,
        discordDisabled: true,
    }
    return ctx.utils.render('login', renderData);
};
