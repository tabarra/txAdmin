const modulename = 'WebServer:AuthVerifyPassword';
import { PassSessAuthType } from '@core/components/WebServer/authLogic';
import { InitializedCtx } from '@core/components/WebServer/ctxTypes';
import { isValidRedirectPath } from '@core/extras/helpers';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);

//Helper functions
const isUndefined = (x: any) => x === undefined;

/**
 * Verify login
 */
export default async function AuthVerifyPassword(ctx: InitializedCtx) {
    if (isUndefined(ctx.request.body.username) || isUndefined(ctx.request.body.password)) {
        return ctx.response.redirect('/');
    }
    const renderData = {
        template: 'normal',
        message: '',
    };

    try {
        //Checking admin
        const vaultAdmin = ctx.txAdmin.adminVault.getAdminByName(ctx.request.body.username);
        if (!vaultAdmin) {
            console.warn(`Wrong username from: ${ctx.ip}`);
            renderData.message = 'Wrong Username!';
            return ctx.utils.render('login', renderData);
        }
        if (!VerifyPasswordHash(ctx.request.body.password.trim(), vaultAdmin.password_hash)) {
            console.warn(`Wrong password from: ${ctx.ip}`);
            renderData.message = 'Wrong Password!';
            return ctx.utils.render('login', renderData);
        }

        //Setting up session
        const sessData = {
            type: 'password',
            username: vaultAdmin.name,
            password_hash: vaultAdmin.password_hash,
            expiresAt: false,
            csrfToken: ctx.txAdmin.adminVault.genCsrfToken(),
        } satisfies PassSessAuthType;
        ctx.sessTools.set({ auth: sessData });

        ctx.txAdmin.logger.admin.write(vaultAdmin.name, `logged in from ${ctx.ip} via password`);
        ctx.txAdmin.statisticsManager.loginOrigins.count(ctx.txVars.hostType);
        ctx.txAdmin.statisticsManager.loginMethods.count('password');
    } catch (error) {
        console.warn(`Failed to authenticate ${ctx.request.body.username} with error: ${(error as Error).message}`);
        console.verbose.dir(error);
        renderData.message = 'Error autenticating admin.';
        return ctx.utils.render('login', renderData);
    }

    const redirectPath = (isValidRedirectPath(ctx.query?.r)) ? ctx.query.r as string : '/';
    return ctx.response.redirect(redirectPath);
};
