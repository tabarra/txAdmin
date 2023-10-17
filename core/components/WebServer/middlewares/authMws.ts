const modulename = 'WebServer:AuthMws';
import consoleFactory from '@extras/console';
import { normalAuthLogic, nuiAuthLogic } from "../authLogic";
import { ApiAuthErrorResp, ApiToastResp, GenericApiErrorResp } from "@shared/genericApiTypes";
import { InitializedCtx } from '../ctxTypes';
const console = consoleFactory(modulename);


/**
 * Intercom auth middleware
 * This does not set ctx.admin and does not use ctx.session whatsoever.
 */
export const intercomAuthMw = async (ctx: InitializedCtx, next: Function) => {
    if (
        typeof ctx.request.body?.txAdminToken !== 'string'
        || ctx.request.body.txAdminToken !== ctx.txAdmin.webServer.luaComToken
    ) {
        return ctx.send({ error: 'invalid token' });
    }

    await next();
};

/**
 * Used for the legacy web interface.
 */
export const legacyWebAuthMw = async (ctx: InitializedCtx, next: Function) => {
    const authResult = normalAuthLogic(ctx.txAdmin, ctx.session);

    if (!authResult.success) {
        ctx.session.auth = {}; //clearing session
        if (authResult.rejectReason) {
            console.verbose.warn(`Invalid session auth: ${authResult.rejectReason}`);
        }
        if (ctx.method === 'GET' && ctx.path !== '/') {
            return ctx.response.redirect(`/auth?logout&r=${encodeURIComponent(ctx.path)}`);
        } else {
            return ctx.response.redirect(`/auth?logout`);
        }
    }

    //Adding the admin to the context
    ctx.admin = authResult.admin;
    await next();
};

/**
 * API Authentication Middleware 
 */
export const apiAuthMw = async (ctx: InitializedCtx, next: Function) => {
    const sendTypedResp = (data: ApiAuthErrorResp | (ApiToastResp & GenericApiErrorResp)) => ctx.send(data);

    //Check if the source is web or nui
    const authResult = ctx.txVars.isWebInterface
        ? normalAuthLogic(ctx.txAdmin, ctx.session)
        : nuiAuthLogic(ctx.txAdmin, ctx.ip, ctx.request.headers)
    if (!authResult.success) {
        ctx.session.auth = {}; //clearing session
        if (authResult.rejectReason) {
            console.verbose.warn(`Invalid session auth: ${authResult.rejectReason}`);
        }
        return sendTypedResp({
            logout: true,
            reason: authResult.rejectReason ?? 'no session'
        });
    }

    //For web routes, we need to check the CSRF token
    //For nui routes, we need to check the luaComToken, which is already done in nuiAuthLogic above
    if (ctx.txVars.isWebInterface) {
        const sessToken = ctx.session?.auth?.csrfToken; //it should exist because of authLogic
        const headerToken = ctx.headers['x-txadmin-csrftoken'];
        if (!sessToken || !headerToken || sessToken !== headerToken) {
            console.verbose.warn(`Invalid CSRF token: ${ctx.path}`);
            const msg = (headerToken)
                ? 'Error: Invalid CSRF token, please refresh the page or try to login again.'
                : 'Error: Missing HTTP header \'x-txadmin-csrftoken\'. This likely means your files are not updated or you are using some reverse proxy that is removing this header from the HTTP request.';

            //Doing ApiAuthErrorResp & GenericApiErrorResp to maintain compatibility with all routes
            //"error" is used by diagnostic, masterActions, playerlist, whitelist and possibly more
            return sendTypedResp({
                type: 'danger',
                message: msg,
                error: msg
            });
        }
    }

    //Adding the admin to the context
    ctx.admin = authResult.admin;
    await next();
};

