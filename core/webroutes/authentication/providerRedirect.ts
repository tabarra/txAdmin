const modulename = 'WebServer:AuthProviderRedirect';
import { InitializedCtx } from '@core/components/WebServer/ctxTypes';
import consoleFactory from '@extras/console';
import { ApiOauthRedirectResp } from '@shared/authApiTypes';
import { z } from 'zod';
import { getOauthRedirectUrl } from './oauthMethods';
const console = consoleFactory(modulename);

const querySchema = z.object({
    origin: z.string(),
});


/**
 * Generates the provider auth url and redirects the user
 */
export default async function AuthProviderRedirect(ctx: InitializedCtx) {
    const schemaRes = querySchema.safeParse(ctx.request.query);
    if (!schemaRes.success) {
        return ctx.send<ApiOauthRedirectResp>({
            error: `Invalid request query: ${schemaRes.error.message}`,
        });
    }
    const { origin } = schemaRes.data;

    //Check if there are already admins set up
    if (!ctx.txAdmin.adminVault.hasAdmins()) {
        return ctx.send<ApiOauthRedirectResp>({
            error: `no_admins_setup`,
        });
    }

    return ctx.send<ApiOauthRedirectResp>({
        authUrl: getOauthRedirectUrl(ctx, 'login', origin),
    });
};
