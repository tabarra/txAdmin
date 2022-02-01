const modulename = 'WebServer:RequestAuthenticator';
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);


/**
 * Returns a session authenticator function
 * @param {string} epType endpoint type
 */
const requestAuth = (epType) => {
    //Intercom auth function
    const intercomAuth = async (ctx, next) => {
        if (
            typeof ctx.request.body.txAdminToken !== 'undefined'
            && ctx.request.body.txAdminToken === globals.webServer.luaComToken
        ) {
            await next();
        } else {
            return ctx.send({error: 'invalid token'});
        }
    };

    //Default auth function
    const defaultAuth = async (ctx, next) => {
        const {isValidAuth} = authLogic(ctx.session, true, epType);

        if (!isValidAuth) {
            if (GlobalData.verbose) logWarn(`Invalid session auth: ${ctx.path}`, epType);
            ctx.session.auth = {};
            if (epType === 'web') {
                return ctx.response.redirect('/auth?logout');
            } else if (epType === 'api') {
                return ctx.send({logout:true});
            } else if (epType === 'nuiStart') {
                const {isValidAuth, admin} = nuiAuthLogic(ctx.ip, ctx.request.headers);

                if (!isValidAuth) {
                    return ctx.response.redirect('/auth?logout');
                } else {
                    const providerWithPicture = Object.values(admin.providers).find((provider) => provider.data && provider.data.picture);
                    ctx.session.auth = {
                        username: admin.name,
                        picture: (providerWithPicture) ? providerWithPicture.data.picture : undefined,
                        password_hash: admin.password_hash,
                        master: admin.master,
                        permissions: admin.permissions,
                        expires_at: false,
                        isWebInterface: false,
                        //Note: we actually need permissions/master because the first request doesn't
                        // go through authLogic() which sets them up
                    };
                    ctx.utils.logAction('logged in from via NUI iframe');
                    globals.databus.txStatsData.login.origins.webpipe++;
                    globals.databus.txStatsData.login.methods.iframe++;
                    await next();
                }
            } else {
                return () => {throw new Error('Unknown auth type');};
            }
        } else {
            await next();
        }
    };

    //NUI auth function
    const nuiAuth = async (ctx, next) => {
        const {isValidAuth, rejectReason, admin} = nuiAuthLogic(ctx.ip, ctx.request.headers);

        if (!isValidAuth) {
            return ctx.send({isAdmin:false, reason: rejectReason});
        } else {
            ctx.nuiSession = {
                auth: {
                    username: admin.name,
                    permissions: admin.permissions,
                    master: admin.master,
                    isWebInterface: false,
                    //Doesn't apply: picture, password_hash, expires_at, isTempPassword
                },
            };
            await next();
        }
    };

    //Socket auth function (used as middleware for all incoming socket.io connections)
    const socketAuth = async (socket, next) => {
        const {isValidAuth} = authLogic(socket.session, true, epType);

        if (isValidAuth) {
            await next();
        } else {
            if (socket.session) socket.session.auth = {}; //a bit redundant but it wont hurt anyone
            socket.disconnect(0);
            if (GlobalData.verbose) logWarn('Auth denied when creating session');
            next(new Error('Authentication Denied'));
        }
    };

    //Return the appropriate function
    if (epType === 'intercom') {
        return intercomAuth;
    } else if (epType === 'web') {
        return defaultAuth;
    } else if (epType === 'api') {
        return defaultAuth;
    } else if (epType === 'nuiStart') {
        return defaultAuth;
    } else if (epType === 'nui') {
        return nuiAuth;
    } else if (epType === 'socket') {
        return socketAuth;
    } else {
        return () => {throw new Error('Unknown auth type');};
    }
};


/**
 * Autentication & authorization logic used in both websocket and webserver
 * @param {object} sess
 * @param {string} perm
 * @param {string} epType endpoint type
 */
const authLogic = (sess, perm, epType) => {
    let isValidAuth = false;
    let isValidPerm = false;
    if (
        typeof sess !== 'undefined'
        && typeof sess.auth !== 'undefined'
        && typeof sess.auth.username !== 'undefined'
        && typeof sess.auth.expires_at !== 'undefined'
    ) {
        let now = Math.round(Date.now() / 1000);
        if (sess.auth.expires_at === false || now < sess.auth.expires_at) {
            try {
                let admin = globals.adminVault.getAdminByName(sess.auth.username);
                if (admin) {
                    if (
                        typeof sess.auth.password_hash == 'string'
                        && admin.password_hash == sess.auth.password_hash
                    ) {
                        isValidAuth = true;
                    } else if (
                        typeof sess.auth.provider == 'string'
                        && typeof admin.providers[sess.auth.provider] == 'object'
                        && sess.auth.provider_uid == admin.providers[sess.auth.provider].id
                    ) {
                        isValidAuth = true;
                    }

                    sess.auth.master = admin.master;
                    sess.auth.permissions = admin.permissions;
                    sess.auth.isTempPassword = (typeof admin.password_temporary !== 'undefined');

                    isValidPerm = (perm === true || (
                        admin.master === true
                        || admin.permissions.includes('all_permissions')
                        || admin.permissions.includes(perm)
                    ));
                }
            } catch (error) {
                if (GlobalData.verbose) {
                    logError('Error validating session data:', epType);
                    dir(error);
                }
            }
        } else {
            if (GlobalData.verbose) logWarn(`Expired session from ${sess.auth.username}`, epType);
        }
    }

    return {isValidAuth, isValidPerm};
};


/**
 * Autentication & authorization logic used in for nui requests
 * @param {string} reqIP
 * @param {object} reqHeader
 */
const nuiAuthLogic = (reqIP, reqHeader) => {
    // Check sus IPs
    if (!GlobalData.loopbackInterfaces.includes(reqIP) && !GlobalData.isZapHosting) {
        if (GlobalData.verbose) {
            logWarn(`NUI Auth Failed: reqIP (${reqIP}) not in ${JSON.stringify(GlobalData.loopbackInterfaces)}.`);
        }
        return {isValidAuth: false, rejectReason: 'Invalid Request: source'};
    }

    // Check missing headers
    if (typeof reqHeader['x-txadmin-token'] !== 'string') {
        return {isValidAuth: false, rejectReason: 'Invalid Request: token header'};
    }
    if (typeof reqHeader['x-txadmin-identifiers'] !== 'string') {
        return {isValidAuth: false, rejectReason: 'Invalid Request: identifiers header'};
    }

    // Check token value
    if (reqHeader['x-txadmin-token'] !== globals.webServer.luaComToken) {
        if (GlobalData.verbose) {
            logWarn(`NUI Auth Failed: token received ${reqHeader['x-txadmin-token']} !== expected ${globals.webServer.luaComToken}.`);
        }
        return {isValidAuth: false, rejectReason: 'Unauthorized: token value'};
    }

    // Check identifier array
    const identifiers = reqHeader['x-txadmin-identifiers']
        .split(',')
        .map((i) => i.trim().toLowerCase())
        .filter((i) => i.length);
    if (!identifiers.length) {
        return {isValidAuth: false, rejectReason: 'Unauthorized: empty identifier array'};
    }

    // Find admin
    try {
        const admin = globals.adminVault.getAdminByIdentifiers(identifiers);
        if (!admin) {
            if (GlobalData.verbose) {
                logWarn(`NUI Auth Failed: no admin found with identifiers ${JSON.stringify(identifiers)}.`);
            }
            return {isValidAuth: false, rejectReason: 'Unauthorized: admin not found'};
        }
        return {isValidAuth: true, admin};
    } catch (error) {
        logWarn(`Failed to authenticate NUI user with error: ${error.message}`);
        if (GlobalData.verbose) dir(error);
        return {isValidAuth: false, rejectReason: 'internal error'};
    }
};


//================================================================
module.exports = {
    requestAuth,
    authLogic,
};
