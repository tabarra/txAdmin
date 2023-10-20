const modulename = 'WebServer:AuthAddMaster';
import { UserInfoType } from '@core/components/AdminVault/providers/CitizenFX';
import { CfxreSessAuthType } from '@core/components/WebServer/authLogic';
import { InitializedCtx } from '@core/components/WebServer/ctxTypes';
import consoleFactory from '@extras/console';
import { TokenSet } from 'openid-client';
const console = consoleFactory(modulename);

//Helper functions
const returnJustMessage = (ctx: InitializedCtx, errorTitle: string, errorMessage?: string) => {
    return ctx.utils.render('login', { template: 'justMessage', errorTitle, errorMessage });
};

/**
 * Handles the Add Master flow
 */
export default async function AuthAddMaster(ctx: InitializedCtx) {
    //Sanity check
    if (typeof ctx.params?.action !== 'string') {
        return ctx.utils.error(400, 'Invalid Request');
    }
    const action = ctx.params.action as string;

    //Check if there are already admins set up
    if (ctx.txAdmin.adminVault.admins !== false) {
        return returnJustMessage(
            ctx,
            'Master account already set.',
        );
    }

    //Delegate to the specific action handler
    if (action == 'pin') {
        return await handlePin(ctx);
    } else if (action == 'callback') {
        return await handleCallback(ctx);
    } else if (action == 'save') {
        return await handleSave(ctx);
    } else {
        return ctx.send({
            type: 'danger',
            message: 'Unknown action.',
        });
    }
};


/**
 * Handle Pin
 */
async function handlePin(ctx: InitializedCtx) {
    //Sanity check
    if (
        typeof ctx.request.body?.pin !== 'string'
        || ctx.method != 'POST'
    ) {
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    //Checking the PIN
    if (ctx.request.body.pin !== ctx.txAdmin.adminVault.addMasterPin) {
        console.warn(`Wrong PIN from: ${ctx.ip}`);
        const message = 'Wrong PIN.';
        return ctx.utils.render('login', { template: 'noMaster', message });
    }

    //Make sure the session is initialized
    ctx.session.startedSocialLogin = Date.now();

    //Generate URL
    try {
        const callback = ctx.protocol + '://' + ctx.get('host') + '/auth/addMaster/callback';
        const url = ctx.txAdmin.adminVault.providers.citizenfx.getAuthURL(callback, ctx.session.externalKey);
        return ctx.response.redirect(url);
    } catch (error) {
        return returnJustMessage(
            ctx,
            'Failed to generate callback URL with error:',
            (error as Error).message,
        );
    }
}


/**
 * Handle Callback
 */
async function handleCallback(ctx: InitializedCtx) {
    //Sanity check
    if (ctx.method != 'GET') {
        return ctx.utils.error(400, 'Invalid Request');
    }

    if (typeof ctx.query.error_description === 'string') {
        return returnJustMessage(
            ctx,
            ctx.query.error_description,
            'Please refresh the page and try again.',
        );
    }

    //Exchange code for access token
    let tokenSet;
    try {
        const currentURL = ctx.protocol + '://' + ctx.get('host') + '/auth/addMaster/callback';
        tokenSet = await ctx.txAdmin.adminVault.providers.citizenfx.processCallback(
            ctx,
            currentURL,
            ctx.session.externalKey
        );
        if (!tokenSet) throw new Error('tokenSet is undefined');
        if (!tokenSet.access_token) throw new Error('tokenSet.access_token is undefined');
    } catch (e) {
        const error = e as any; //couldn't really test those errors, but tested in the past and they worked
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
                'Failed to verify your login with FiveM\'s identity provider. Please try again or check your connection to the internet.',
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
        console.error(`Get UserInfo error: ${(error as Error).message}`);
        return returnJustMessage(
            ctx,
            'Get UserInfo error:',
            (error as Error).message,
        );
    }

    // Setar userinfo na sessão
    ctx.session.tmpAddMasterTokenSet = tokenSet;
    ctx.session.tmpAddMasterUserInfo = userInfo;

    return ctx.utils.render('login', {
        template: 'callback',
        addMaster_name: userInfo.name,
        addMaster_picture: (userInfo.picture) ? userInfo.picture : 'img/default_avatar.png',
    });
}


/**
 * Handle Save
 */
async function handleSave(ctx: InitializedCtx) {
    //Sanity check
    if (
        typeof ctx.request.body.password !== 'string'
        || typeof ctx.request.body.password2 !== 'string'
    ) {
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    //Sanity check2: Electric Boogaloo (Validating password)
    const password = ctx.request.body.password.trim();
    const password2 = ctx.request.body.password2.trim();
    if (password != password2 || password.length < 6 || password.length > 24) {
        return returnJustMessage(
            ctx,
            'Invalid Password.',
        );
    }

    //Checking if ToS/License accepted
    if (ctx.request.body.checkboxAcceptTerms !== 'on') {
        return returnJustMessage(
            ctx,
            'You are required to accept the Rockstar Creator Platform License Agreement and txAdmin License to proceed.',
        );
    }

    //Checking if session is still present
    const userInfo = ctx.session.tmpAddMasterUserInfo as UserInfoType;
    const tokenSet = ctx.session.tmpAddMasterTokenSet as TokenSet;
    if (
        typeof userInfo?.name !== 'string'
        || typeof tokenSet?.access_token !== 'string'
    ) {
        return returnJustMessage(
            ctx,
            'Invalid Session.',
            'You may have restarted txAdmin right before entering this page. Please try again.',
        );
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

    //Creating admins file
    try {
        ctx.txAdmin.adminVault.createAdminsFile(
            userInfo.name,
            identifier,
            userInfo,
            password,
            true
        );
    } catch (error) {
        return returnJustMessage(
            ctx,
            'Error:',
            (error as Error).message,
        );
    }

    //If the user has a picture, save it to the cache
    if (userInfo.picture) {
        ctx.txAdmin.persistentCache.set(
            `admin:picture:${userInfo.name}`,
            userInfo.picture
        );
    }

    //Login user
    try {
        ctx.session.auth = {
            type: 'cfxre',
            username: userInfo.name,
            csrfToken: ctx.txAdmin.adminVault.genCsrfToken(),
            expiresAt: Date.now() + 86_400_000, //24h,
            identifier,
        } satisfies CfxreSessAuthType;

        delete ctx.session.tmpAddMasterTokenSet;
        delete ctx.session.tmpAddMasterUserInfo;
    } catch (error) {
        ctx.session.auth = {};
        console.error(`Failed to login: ${(error as Error).message}`);
        return returnJustMessage(
            ctx,
            'Failed to login:',
            (error as Error).message,
        );
    }

    ctx.txAdmin.logger.admin.write(ctx.session.auth.username, 'created admins file');
    return ctx.response.redirect('/');
}
