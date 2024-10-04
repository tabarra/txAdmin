const modulename = 'WebServer:AuthVerifyPassword';
import { AuthedAdmin, PassSessAuthType } from '@core/components/WebServer/authLogic';
import { InitializedCtx } from '@core/components/WebServer/ctxTypes';
import { txEnv } from '@core/globalData';
import consoleFactory from '@extras/console';
import { ApiVerifyPasswordResp, ReactAuthDataType } from '@shared/authApiTypes';
import { z } from 'zod';
const console = consoleFactory(modulename);

//Helper functions
const bodySchema = z.object({
    username: z.string().trim(),
    password: z.string().trim(),
});
export type ApiVerifyPasswordReqSchema = z.infer<typeof bodySchema>;

/**
 * Verify login
 */
export default async function AuthVerifyPassword(ctx: InitializedCtx) {
    //Check UI version
    const { uiVersion } = ctx.request.query;
    if(uiVersion && uiVersion !== txEnv.txAdminVersion){
        return ctx.send<ApiVerifyPasswordResp>({
            error: `refreshToUpdate`,
        });
    }

    //Checking body
    const schemaRes = bodySchema.safeParse(ctx.request.body);
    if (!schemaRes.success) {
        return ctx.send<ApiVerifyPasswordResp>({
            error: `Invalid request body: ${schemaRes.error.message}`,
        });
    }
    const postBody = schemaRes.data;

    //Check if there are already admins set up
    if (!ctx.txAdmin.adminVault.hasAdmins()) {
        return ctx.send<ApiVerifyPasswordResp>({
            error: `no_admins_setup`,
        });
    }

    try {
        //Checking admin
        const vaultAdmin = ctx.txAdmin.adminVault.getAdminByName(postBody.username);
        if (!vaultAdmin) {
            console.warn(`Wrong username from: ${ctx.ip}`);
            return ctx.send<ApiVerifyPasswordResp>({
                error: 'Wrong username or password!',
            });
        }
        if (!VerifyPasswordHash(postBody.password, vaultAdmin.password_hash)) {
            console.warn(`Wrong password from: ${ctx.ip}`);
            return ctx.send<ApiVerifyPasswordResp>({
                error: 'Wrong username or password!',
            });
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
        ctx.txAdmin.statsManager.txRuntime.loginOrigins.count(ctx.txVars.hostType);
        ctx.txAdmin.statsManager.txRuntime.loginMethods.count('password');

        const authedAdmin = new AuthedAdmin(ctx.txAdmin, vaultAdmin, sessData.csrfToken)
        return ctx.send<ReactAuthDataType>(authedAdmin.getAuthData());

    } catch (error) {
        console.warn(`Failed to authenticate ${postBody.username} with error: ${(error as Error).message}`);
        console.verbose.dir(error);
        return ctx.send<ApiVerifyPasswordResp>({
            error: 'Error autenticating admin.',
        });
    }
};
