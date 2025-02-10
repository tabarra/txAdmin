const modulename = 'WebServer:AuthAddMasterPin';
import { InitializedCtx } from '@modules/WebServer/ctxTypes';
import consoleFactory from '@lib/console';
import { ApiOauthRedirectResp } from '@shared/authApiTypes';
import { z } from 'zod';
import { getOauthRedirectUrl } from './oauthMethods';
const console = consoleFactory(modulename);

//Helper functions
const bodySchema = z.object({
    pin: z.string().trim(),
    origin: z.string(),
});
export type ApiAddMasterPinReqSchema = z.infer<typeof bodySchema>;

/**
 * Handles the Add Master flow
 */
export default async function AuthAddMasterPin(ctx: InitializedCtx) {
    const schemaRes = bodySchema.safeParse(ctx.request.body);
    if (!schemaRes.success) {
        return ctx.send<ApiOauthRedirectResp>({
            error: `Invalid request body: ${schemaRes.error.message}`,
        });
    }
    const { pin, origin } = schemaRes.data;

    //Check if there are already admins set up
    if (txCore.adminStore.hasAdmins()) {
        return ctx.send<ApiOauthRedirectResp>({
            error: `master_already_set`,
        });
    }

    //Checking the PIN
    if (!pin.length || pin !== txCore.adminStore.addMasterPin) {
        return ctx.send<ApiOauthRedirectResp>({
            error: `Wrong PIN.`,
        });
    }

    return ctx.send<ApiOauthRedirectResp>({
        authUrl: getOauthRedirectUrl(ctx, 'addMaster', origin),
    });
};
