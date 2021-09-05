//Requires
const modulename = 'WebServer:AuthGet';
const chalk = require('chalk');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);


//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined'); };

/**
 * Gets the login page and destroys session if /auth?logout is defined
 * @param {object} ctx
 */
module.exports = async function AuthGet(ctx) {
    //Set template type
    let template;
    if (universal.adminVault.admins === false) {
        template = 'noMaster';
        if (universal.adminVault.addMasterPin) {
            log('Use this PIN to add a new master account: ' + chalk.inverse(` ${universal.adminVault.addMasterPin} `));
        }
    } else {
        template = 'normal';
    }

    //Destroy session? And start a new one
    if (!isUndefined(ctx.query.logout)) ctx.session.auth = {};

    //If admins file was deleted
    if (Array.isArray(universal.adminVault.admins) && !universal.adminVault.admins.length) {
        return ctx.utils.render('login', {
            template: 'justMessage',
            errorTitle: 'No admins configured.',
            errorMessage: 'This likely means that you moved or deleted the admins.json file. Please restart txAdmin to configure a new master account.',
        });
    }

    //Render page
    const renderData = {
        template,
        message: (!isUndefined(ctx.query.logout)) ? 'Logged Out' : '',
        citizenfxDisabled: !universal.adminVault.providers.citizenfx.ready,
        discordDisabled: true,
    };
    return ctx.utils.render('login', renderData);
};
