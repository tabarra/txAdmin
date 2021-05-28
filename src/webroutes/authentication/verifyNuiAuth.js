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
    const unsafeIdentifiers = ctx.request.headers['x-txadmin-identifiers'] || '';

    // reject sus ips
    if (!['::1', '127.0.0.1', '127.0.1.1'].includes(ctx.ip)) {
        return ctx.utils.error(400, 'Invalid Request');
    }

    if (isUndefined(ctx.request.headers['x-txadmin-token']) || isUndefined(ctx.request.headers['x-txadmin-identifiers'])) {
        return ctx.utils.error(400, 'Invalid Request');
    }

    // token?
    if (ctx.request.headers['x-txadmin-token'] !== globals.webServer.fxWebPipeToken) {
        return ctx.utils.error(401, 'invalid token');
    }

    try {
        const identifiers = unsafeIdentifiers.split(',');
        let admin = globals.adminVault.getAdminByIdentifiers(identifiers);
        if (!admin) {
            return ctx.send({isAdmin: false});
        }

        //Setting up session
        const providerWithPicture = Object.values(admin.providers).find((provider) => provider.data && provider.data.picture);
        ctx.session.auth = {
            username: admin.name,
            picture: (providerWithPicture) ? providerWithPicture.data.picture : undefined,
            password_hash: admin.password_hash,
            expires_at: Math.ceil((+new Date + sessDuration) / 1000),
            isWebInterface: false,
            //FIXME: Tabarra needs to build security around this value
        };
        log(`Admin ${admin.name} logged into the in-game UI`);
        //dir(admin);
        const permissions = admin.master ? ['all_permissions'] : admin.permissions;
        ctx.send({
            isAdmin: true,
            permissions,
            expiration: Date.now() + sessDuration,
        });

        // FIXME: tabarra
        // globals.databus.txStatsData.loginOrigins[ctx.txVars.hostType]++;
        // globals.databus.txStatsData.loginMethods.password++;
    } catch (error) {
        logWarn(`Failed to authenticate NUI user with error: ${error.message}`);
        if (GlobalData.verbose) dir(error);
        return ctx.utils.error(500, 'internal error');
    }
};
