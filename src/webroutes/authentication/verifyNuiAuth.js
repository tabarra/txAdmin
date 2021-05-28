//Requires
const modulename = 'WebServer:VerifyNuiAuth';
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined'); };
const sessDuration = 60 * 60 * 1000; //one hour

/**
 * Verify login
 * @param {object} ctx
 */
// FIXME: add logging
module.exports = async function VerifyNuiAuth(ctx) {
    // return ctx.send({isAdmin: false});
    return ctx.send({
        isAdmin: true,
        permissions: ['all_permissions'],
        expiration: Date.now() + sessDuration,
    });

    dir(ctx.request.headers['x-txadmin-identifiers']);
    // return ctx.response.redirect('/setup');
    if (isUndefined(ctx.request.headers['x-txadmin-token']) || isUndefined(ctx.request.headers['x-txadmin-identifiers'])) {
        return ctx.utils.error(400, 'Invalid Request');
    }

    // token?
    if (ctx.request.headers['x-txadmin-token'] !== globals.webServer.intercomToken) {
        return ctx.utils.error(401, 'invalid token');
    }

    try {
        //FIXME: use identifiers
        let admin = globals.adminVault.getAdminByName('test_account');
        if (!admin) {
            return ctx.send({isAdmin: false});
        }

        //Setting up session
        const providerWithPicture = Object.values(admin.providers).find((provider) => provider.data && provider.data.picture);
        ctx.session.auth = {
            username: admin.name,
            picture: (providerWithPicture) ? providerWithPicture.data.picture : undefined,
            password_hash: admin.password_hash,
            expires_at: false,
            isWebInterface: false, //FIXME:
        };
        log(`Admin ${admin.name} logged in from ${ctx.ip}`);

        // return ctx.response.redirect('/');
        ctx.set('x-txadmin-perms', admin.permissions.join(';'));
        return ctx.send({isAdmin: true});


        // globals.databus.txStatsData.login.origins[ctx.txVars.hostType]++;
        // globals.databus.txStatsData.login.methods.password++;

        // let admin = null;
        // for (const identifier of ctx.request.headers['x-txadmin-identifiers'].split(', ')) {
        //     admin = globals.authenticator.getAdminByIdentifier(identifier);

        //     if (admin) {
        //         break;
        //     }
        // }
        // //Admin exists?
        // if (!admin) {
        //     ctx.body = ' ';
        //     return;
        // }


        //Setting up session
        // ctx.session.auth = {
        //     provider: 'citizenfx', // tentative
        //     provider_uid: admin.providers['citizenfx'].id,
        //     username: admin.name,
        //     picture: (providerWithPicture) ? providerWithPicture.data.picture : undefined,
        //     expires_at: Math.round(Date.now() / 1000) + 86400,
        // };

        // log(`Admin ${admin.name} logged in from in-game UI`);
        // globals.databus.txStatsData.loginOrigins[ctx.txVars.hostType]++;
        // globals.databus.txStatsData.loginMethods.password++;

        // return ctx.response.redirect('/');
    } catch (error) {
        logWarn(`Failed to authenticate NUI user with error: ${error.message}`);
        if (GlobalData.verbose) dir(error);
        return ctx.utils.error(500, 'internal error');
    }
};
