const modulename = 'WebServer:AuthProviderRedirect';
import { InitializedCtx } from '@core/components/WebServer/ctxTypes';
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
    //Sanity check
    if (typeof ctx.params.provider !== 'string') {
        return ctx.utils.error(400, 'Invalid Request');
    }
    const provider = ctx.params.provider as string;

    if (provider !== 'citizenfx') {
        return returnJustMessage(ctx, 'Provider not implemented... yet');
    }

    //Make sure the session is initialized
    ctx.session.startedSocialLogin = Date.now();

    //Save redirection path in session, if any
    //NOTE: technically we don't need to regex validate here, as that will be done on providerCallback
    if (isValidRedirectPath(ctx.query?.r)) {
        ctx.session.socialLoginRedirect = ctx.query.r;
    }

    //Generate CitizenFX provider Auth URL
    const callbackUrl = ctx.protocol + '://' + ctx.get('host') + '/auth/citizenfx/callback';
    try {
        const urlCitizenFX = ctx.txAdmin.adminVault.providers.citizenfx.getAuthURL(
            callbackUrl,
            ctx.session.externalKey,
        );
        return ctx.response.redirect(urlCitizenFX);
    } catch (error) {
        console.verbose.warn(`Failed to generate CitizenFX Auth URL with error: ${(error as Error).message}`);
        return returnJustMessage(ctx, 'Failed to generate callback URL:', (error as Error).message);
    }
};
