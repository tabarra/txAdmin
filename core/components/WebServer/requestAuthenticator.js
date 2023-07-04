const modulename = 'WebServer:RequestAuthenticator';
import { convars } from '@core/globalData';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);


/**
 * Returns a session authenticator function
 * @param {string} epType endpoint type
 */
export const requestAuth = (epType) => {
    //Intercom auth function
    const intercomAuth = async (ctx, next) => {
        if (
            typeof ctx.request.body.txAdminToken !== 'undefined'
            && ctx.request.body.txAdminToken === globals.webServer.luaComToken
        ) {
            await next();
        } else {
            return ctx.send({ error: 'invalid token' });
        }
    };

    //Default auth function
    const defaultAuth = async (ctx, next) => {
        const { isValidAuth } = authLogic(ctx.session, true, epType);

        //This is kinda messy and in the wrong place, but it's fine for now
        if (epType === 'api') {
            const sessToken = ctx.session?.auth?.csrfToken;
            const headerToken = ctx.headers['x-txadmin-csrftoken'];
            if (sessToken && (sessToken !== headerToken)) {
                console.verbose.warn(`Invalid CSRF token: ${ctx.path}`, epType);
                const msg = (headerToken)
                    ? 'Error: Invalid CSRF token, please refresh the page or try to login again.'
                    : 'Error: Missing HTTP header \'x-txadmin-csrftoken\'. This likely means your files are not updated or you are using some reverse proxy that is removing this header from the HTTP request.';
                //to maintain compatibility with all routes
                return ctx.send({
                    type: 'danger',
                    message: msg,
                    error: msg
                });
            }
        }

        if (!isValidAuth) {
            console.verbose.warn(`Invalid session auth: ${ctx.path}`, epType);
            ctx.session.auth = {};
            if (epType === 'web') {
                if (ctx.method === 'GET' && ctx.path !== '/') {
                    return ctx.response.redirect(`/auth?logout&r=${encodeURIComponent(ctx.path)}`);
                } else {
                    return ctx.response.redirect(`/auth?logout`);
                }
            } else if (epType === 'api') {
                return ctx.send({ logout: true });
            } else if (epType === 'nuiStart') {
                const { isValidAuth, admin } = nuiAuthLogic(ctx.ip, ctx.request.headers);

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
                        csrfToken: globals.adminVault.genCsrfToken(),
                        //Note: we actually need permissions/master because the first request doesn't
                        // go through authLogic() which sets them up
                    };
                    ctx.utils.logAction('logged in from via NUI iframe');
                    globals?.statisticsManager.loginOrigins.count('webpipe');
                    globals?.statisticsManager.loginMethods.count('iframe');
                    await next();
                }
            } else {
                return () => { throw new Error('Unknown auth type'); };
            }
        } else {
            await next();
        }
    };

    //NUI auth function
    const nuiAuth = async (ctx, next) => {
        const { isValidAuth, rejectReason, admin } = nuiAuthLogic(ctx.ip, ctx.request.headers);

        if (!isValidAuth) {
            return ctx.send({ isAdmin: false, reason: rejectReason });
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
    } else {
        return () => { throw new Error('Unknown auth type'); };
    }
};


/**
 * Autentication & authorization logic used in both websocket and webserver
 * @param {unknown} sess
 * @param {string|true} perm
 * @param {string} epType endpoint type
 */
export const authLogic = (sess, perm, epType) => {
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
                        typeof sess.auth.password_hash === 'string'
                        && admin.password_hash === sess.auth.password_hash
                    ) {
                        isValidAuth = true;
                    } else if (
                        typeof sess.auth.provider === 'string'
                        && typeof admin.providers[sess.auth.provider] === 'object'
                        && sess.auth.provider_identifier === admin.providers[sess.auth.provider].identifier
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
                console.verbose.error('Error validating session data:', epType);
                console.verbose.dir(error);
            }
        } else {
            console.verbose.warn(`Expired session from ${sess.auth.username}`, epType);
        }
    }

    return { isValidAuth, isValidPerm };
};


/**
 * Autentication & authorization logic used in for nui requests
 * @param {string} reqIP
 * @param {object} reqHeader
 */
const nuiAuthLogic = (reqIP, reqHeader) => {
    // Check sus IPs
    if (
        !convars.loopbackInterfaces.includes(reqIP)
        && !convars.isZapHosting
        && !globals.webServer.config.disableNuiSourceCheck
    ) {
        console.verbose.warn(`NUI Auth Failed: reqIP "${reqIP}" not in ${JSON.stringify(convars.loopbackInterfaces)}.`);
        return { isValidAuth: false, rejectReason: 'Invalid Request: source' };
    }

    // Check missing headers
    if (typeof reqHeader['x-txadmin-token'] !== 'string') {
        return { isValidAuth: false, rejectReason: 'Invalid Request: token header' };
    }
    if (typeof reqHeader['x-txadmin-identifiers'] !== 'string') {
        return { isValidAuth: false, rejectReason: 'Invalid Request: identifiers header' };
    }

    // Check token value
    if (reqHeader['x-txadmin-token'] !== globals.webServer.luaComToken) {
        console.verbose.warn(`NUI Auth Failed: token received ${reqHeader['x-txadmin-token']} !== expected ${globals.webServer.luaComToken}.`);
        return { isValidAuth: false, rejectReason: 'Unauthorized: token value' };
    }

    // Check identifier array
    const identifiers = reqHeader['x-txadmin-identifiers']
        .split(',')
        .map((i) => i.trim().toLowerCase())
        .filter((i) => i.length);
    if (!identifiers.length) {
        return { isValidAuth: false, rejectReason: 'Unauthorized: empty identifier array' };
    }

    // Find admin
    try {
        const admin = globals.adminVault.getAdminByIdentifiers(identifiers);
        if (!admin) {
            // console.verbose.warn(`NUI Auth Failed: no admin found with identifiers ${JSON.stringify(identifiers)}.`);
            return { isValidAuth: false, rejectReason: 'admin_not_found' };
        }
        return { isValidAuth: true, admin };
    } catch (error) {
        console.warn(`Failed to authenticate NUI user with error: ${error.message}`);
        console.verbose.dir(error);
        return { isValidAuth: false, rejectReason: 'internal core error' };
    }
};
