//Requires
const modulename = 'WebServer:VerifyNuiAuth';
const { customAlphabet } = require('nanoid');
const dict51 = require('nanoid-dictionary/nolookalikes');
const nanoid = customAlphabet(dict51, 20);
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Helper functions
const sessDuration = 60 * 60 * 1000; //one hour

/**
 * Verify login
 * @param {object} ctx
 */
// FIXME: add logging
module.exports = async function VerifyNuiAuth(ctx) {
    // Check sus IPs
    if (!GlobalData.loopbackInterfaces.includes(ctx.ip) && !GlobalData.isZapHosting) {
        if (GlobalData.verbose) {
            logWarn(`NUI Auth Failed: ctx.ip (${ctx.ip}) not in ${JSON.stringify(GlobalData.loopbackInterfaces)}.`);
        }
        return ctx.send({isAdmin: false, reason: 'Invalid Request: source'});
    }

    // Check missing headers
    if (typeof ctx.request.headers['x-txadmin-token'] !== 'string') {
        return ctx.send({isAdmin: false, reason: 'Invalid Request: token header'});
    }
    if (typeof ctx.request.headers['x-txadmin-identifiers'] !== 'string') {
        return ctx.send({isAdmin: false, reason: 'Invalid Request: identifiers header'});
    }

    // Check token value
    if (ctx.request.headers['x-txadmin-token'] !== globals.webServer.fxWebPipeToken) {
        if (GlobalData.verbose) {
            logWarn(`NUI Auth Failed: token received ${ctx.request.headers['x-txadmin-token']} !== expected ${globals.webServer.fxWebPipeToken}.`);
        }
        return ctx.send({isAdmin: false, reason: 'Unauthorized: token value'});
    }

    // Check identifier array
    const identifiers = ctx.request.headers['x-txadmin-identifiers']
        .split(',')
        .map((i) => i.trim().toLowerCase())
        .filter((i) => i.length);
    if (!identifiers.length) {
        return ctx.send({isAdmin: false, reason: 'Unauthorized: empty identifier array'});
    }

    try {
        const admin = globals.adminVault.getAdminByIdentifiers(identifiers);
        if (!admin) {
            if (GlobalData.verbose) {
                logWarn(`NUI Auth Failed: no admin found with identifiers ${JSON.stringify(identifiers)}.`);
            }
            return ctx.send({isAdmin: false, reason: 'Unauthorized: admin not found'});
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
            luaToken: nanoid(),
        });

        // FIXME: tabarra
        globals.databus.txStatsData.login.origins.webpipe++;
        globals.databus.txStatsData.login.methods.nui++;
    } catch (error) {
        logWarn(`Failed to authenticate NUI user with error: ${error.message}`);
        if (GlobalData.verbose) dir(error);
        return ctx.send({isAdmin: false, reason: 'internal error'});
    }
};
