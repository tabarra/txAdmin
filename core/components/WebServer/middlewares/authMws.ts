const modulename = 'WebServer:AuthMws';
import consoleFactory from '@extras/console';
import { checkRequestAuth } from "../authLogic";
import { ApiAuthErrorResp, ApiToastResp, GenericApiErrorResp } from "@shared/genericApiTypes";
import { InitializedCtx } from '../ctxTypes';
const console = consoleFactory(modulename);

const webLogoutPage = `<style>
body {
    margin: 0;
}
.notice {
    font-family: sans-serif;
    font-size: 1.5em;
    text-align: center;
    background-color: #222326;
    color: #F7F7F8;
    padding: 2em;
    border: 1px solid #333539;
    border-radius: 0.5em;
}
.notice a {
    color: #F00A53;
}
</style>
    <p class="notice">
        User logged out. <br>
        Redirecting to <a href="/login#expired" target="_parent">login page</a>...
    </p>
<script>
    // Notify parent window that auth failed
    window.parent.postMessage({ type: 'logoutNotice' });
    // If parent redirect didn't work, redirect here
    setTimeout(function() {
        window.parent.location.href = '/login#expired';
    }, 2000);
</script>`;


/**
 * Intercom auth middleware
 * This does not set ctx.admin and does not use session/cookies whatsoever.
 * FIXME: add isLocalAddress check?
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
export const webAuthMw = async (ctx: InitializedCtx, next: Function) => {
    //Check auth
    const authResult = checkRequestAuth(
        ctx.txAdmin,
        ctx.request.headers,
        ctx.ip,
        ctx.txVars.isLocalRequest,
        ctx.sessTools
    );
    if (!authResult.success) {
        ctx.sessTools.destroy();
        if (authResult.rejectReason) {
            console.verbose.warn(`Invalid session auth: ${authResult.rejectReason}`);
        }
        return ctx.send(webLogoutPage);
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

    //Check auth
    const authResult = checkRequestAuth(
        ctx.txAdmin,
        ctx.request.headers,
        ctx.ip,
        ctx.txVars.isLocalRequest,
        ctx.sessTools
    );
    if (!authResult.success) {
        ctx.sessTools.destroy();
        if (authResult.rejectReason && (authResult.rejectReason !== 'nui_admin_not_found' || console.isVerbose)) {
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
        const sessToken = authResult.admin?.csrfToken; //it should exist for nui because of authLogic
        const headerToken = ctx.headers['x-txadmin-csrftoken'];
        if (!sessToken || !headerToken || sessToken !== headerToken) {
            console.verbose.warn(`Invalid CSRF token: ${ctx.path}`);
            const msg = (headerToken)
                ? 'Error: Invalid CSRF token, please refresh the page or try to login again.'
                : 'Error: Missing HTTP header \'x-txadmin-csrftoken\'. This likely means your files are not updated or you are using some reverse proxy that is removing this header from the HTTP request.';

            //Doing ApiAuthErrorResp & GenericApiErrorResp to maintain compatibility with all routes
            //"error" is used by diagnostic, masterActions, playerlist, whitelist and possibly more
            return sendTypedResp({
                type: 'error',
                msg: msg,
                error: msg
            });
        }
    }

    //Adding the admin to the context
    ctx.admin = authResult.admin;
    await next();
};
