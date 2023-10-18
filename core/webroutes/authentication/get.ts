const modulename = 'WebServer:AuthGet';
import chalk from 'chalk';
import consoleFactory from '@extras/console';
import { InitializedCtx } from '@core/components/WebServer/ctxTypes';
const console = consoleFactory(modulename);


/**
 * Gets the login page and destroys session if /auth?logout is defined
 */
export default async function AuthGet(ctx: InitializedCtx) {
    //shortcut
    const adminVault = ctx.txAdmin.adminVault;

    //Set template type
    let template;
    if (adminVault.admins === false) {
        template = 'noMaster';
        if (adminVault.addMasterPin) {
            console.log('Use this PIN to add a new master account: ' + chalk.inverse(` ${adminVault.addMasterPin} `));
        }
    } else {
        template = 'normal';
    }

    //Destroy session? And start a new one
    if (ctx.query.logout !== undefined) ctx.session.auth = {};

    //If admins file was deleted
    //NOTE: this is likely impossible to happen because the admins file is auto recovered
    //      and if you start txadmin without the file, it becomes a noMaster scenario
    if (Array.isArray(adminVault.admins) && !adminVault.admins.length) {
        return ctx.utils.render('login', {
            template: 'justMessage',
            errorTitle: 'No admins configured.',
            errorMessage: 'This likely means that you moved or deleted the admins.json file. Please restart txAdmin to configure a new master account.',
        });
    }

    //Render page
    const renderData = {
        template,
        message: (ctx.query.logout !== undefined) ? 'Logged Out' : '',
        citizenfxDisabled: !adminVault.providers.citizenfx.ready,
    };
    return ctx.utils.render('login', renderData);
};
