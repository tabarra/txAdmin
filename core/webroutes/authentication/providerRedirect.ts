const modulename = 'WebServer:AuthProviderRedirect';
import { randomUUID } from 'node:crypto';
import { InitializedCtx } from '@core/components/WebServer/ctxTypes';
import { ValidSessionType } from '@core/components/WebServer/middlewares/sessionMws';
import { isValidRedirectPath } from '@core/extras/helpers';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);

//Helper functions
const returnJustMessage = (ctx: InitializedCtx, errorTitle: string, errorMessage?: string) => {
    return ctx.utils.render('login', { template: 'justMessage', errorTitle, errorMessage });
};

/**
 * Generates the provider auth url and redirects the user
 */
export default async function AuthProviderRedirect(ctx: InitializedCtx) {
    //Save redirection path in session, if any
    //NOTE: technically we don't need to regex validate here, as that will be done on providerCallback
    let postLoginRedirect;
    if (isValidRedirectPath(ctx.query?.r)) {
        postLoginRedirect = ctx.query.r as string;
    }

    //Setting up session
    //NOTE: The session needs to be set up here, otherwise the return state will be invalid
    const sessData = {
        tmpOauthLoginStateKern: randomUUID(),
        tmpOauthLoginPostRedirect: postLoginRedirect,
    } satisfies ValidSessionType;
    ctx.sessTools.set(sessData);

    //Generate CitizenFX provider Auth URL
    const callbackUrl = ctx.protocol + '://' + ctx.get('host') + '/auth/cfxre/callback';
    try {
        const urlCitizenFX = ctx.txAdmin.adminVault.providers.citizenfx.getAuthURL(
            callbackUrl,
            sessData.tmpOauthLoginStateKern,
        );
        return ctx.response.redirect(urlCitizenFX);
    } catch (error) {
        console.verbose.warn(`Failed to generate CitizenFX Auth URL with error: ${(error as Error).message}`);
        return returnJustMessage(ctx, 'Failed to generate callback URL:', (error as Error).message);
    }
};
