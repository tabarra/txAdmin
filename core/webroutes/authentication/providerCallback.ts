const modulename = 'WebServer:AuthProviderCallback';
import crypto from 'node:crypto';
import { isValidRedirectPath } from '@core/extras/helpers';
import consoleFactory from '@extras/console';
import { InitializedCtx } from '@core/components/WebServer/ctxTypes';
import { CfxreSessAuthType } from '@core/components/WebServer/authLogic';
const console = consoleFactory(modulename);

//Helper functions
const returnJustMessage = (ctx: InitializedCtx, errorTitle: string, errorMessage?: string) => {
    return ctx.utils.render('login', { template: 'justMessage', errorTitle, errorMessage });
};

/**
 * Handles the provider login callbacks
 */
export default async function AuthProviderCallback(ctx: InitializedCtx) {
    if (typeof ctx.query.error_description === 'string') {
        return returnJustMessage(
            ctx,
            ctx.query.error_description,
            'Please refresh the page and try again.',
        );
    }

    //Checking session
    const inboundSession = ctx.sessTools.get();
    if(!inboundSession || !inboundSession?.tmpOauthLoginStateKern){
        return returnJustMessage(
            ctx,
            'Invalid Browser Session.',
            'You may have restarted txAdmin right before entering this page, or copied the link to another browser. Please try again.',
        );
    }

    //Exchange code for access token
    let tokenSet;
    try {
        const currentURL = ctx.protocol + '://' + ctx.get('host') + `/auth/cfxre/callback`;
        tokenSet = await ctx.txAdmin.adminVault.providers.citizenfx.processCallback(
            ctx,
            currentURL,
            inboundSession.tmpOauthLoginStateKern
        );
        if (!tokenSet) throw new Error('tokenSet is undefined');
        if (!tokenSet.access_token) throw new Error('tokenSet.access_token is undefined');
    } catch (e) {
        const error = e as any;
        console.warn(`Code Exchange error: ${error.message}`);
        if (error.tolerance !== undefined) {
            return returnJustMessage(
                ctx,
                'Please Update/Synchronize your VPS clock.',
                'Failed to login because this host\'s time is wrong. Please make sure to synchronize it with the internet.',
            );
        } else if (error.code === 'ETIMEDOUT') {
            return returnJustMessage(
                ctx,
                'Connection to FiveM servers timed out:',
                'Please try again or login using your existing username and backup password.',
            );
        } else if (error.message.startsWith('state mismatch')) {
            return returnJustMessage(
                ctx,
                'Invalid Browser Session.',
                'You may have restarted txAdmin right before entering this page, or copied the link to another browser. Please try again.',
            );
        } else {
            return returnJustMessage(ctx, 'Code Exchange error:', error.message);
        }
    }

    //Get userinfo
    let userInfo;
    try {
        userInfo = await ctx.txAdmin.adminVault.providers.citizenfx.getUserInfo(tokenSet.access_token);
    } catch (error) {
        console.verbose.error(`Get UserInfo error: ${(error as Error).message}`);
        return returnJustMessage(ctx, 'Get UserInfo error:', (error as Error).message);
    }

    //Getting identifier
    let identifier;
    try {
        const res = /\/user\/(\d{1,8})/.exec(userInfo.nameid);
        //@ts-expect-error
        identifier = `fivem:${res[1]}`;
    } catch (error) {
        return returnJustMessage(
            ctx,
            'Invalid nameid identifier.',
            `Could not extract the user identifier from the URL below. Please report this to the txAdmin dev team.\n${userInfo.nameid.toString()}`,
        );
    }

    //Check & Login user
    try {
        const vaultAdmin = ctx.txAdmin.adminVault.getAdminByIdentifiers([identifier]);
        if (!vaultAdmin) {
            ctx.sessTools.destroy();
            return returnJustMessage(
                ctx,
                `The Cfx.re account '${userInfo.name}' is not an admin.`,
                'This username is not assigned to any registered account. You can also try to login using your username and backup password.',
            );
        }

        //Setting session
        const sessData = {
            type: 'cfxre',
            username: userInfo.name,
            csrfToken: ctx.txAdmin.adminVault.genCsrfToken(),
            expiresAt: Date.now() + 86_400_000, //24h,
            identifier,
        } satisfies CfxreSessAuthType;
        ctx.sessTools.set({ auth: sessData });

        //Save the updated provider identifier & data to the admins file
        await ctx.txAdmin.adminVault.refreshAdminSocialData(vaultAdmin.name, 'citizenfx', identifier, userInfo);

        //If the user has a picture, save it to the cache
        if (userInfo.picture) {
            ctx.txAdmin.persistentCache.set(`admin:picture:${vaultAdmin.name}`, userInfo.picture);
        }

        ctx.txAdmin.logger.admin.write(vaultAdmin.name, `logged in from ${ctx.ip} via cfxre`);
        ctx.txAdmin.statisticsManager.loginOrigins.count(ctx.txVars.hostType);
        ctx.txAdmin.statisticsManager.loginMethods.count('citizenfx');
        const redirectPath = isValidRedirectPath(inboundSession.tmpOauthLoginPostRedirect)
            ? inboundSession.tmpOauthLoginPostRedirect as string
            : '/';
        return ctx.response.redirect(redirectPath);
    } catch (error) {
        ctx.sessTools.destroy();
        console.verbose.error(`Failed to login: ${(error as Error).message}`);
        return returnJustMessage(ctx, 'Failed to login:', (error as Error).message);
    }
};
