const modulename = 'WebServer:AuthAddMasterSave';
import { AuthedAdmin, CfxreSessAuthType } from '@core/components/WebServer/authLogic';
import { InitializedCtx } from '@core/components/WebServer/ctxTypes';
import consoleFactory from '@extras/console';
import { getIdFromOauthNameid } from '@extras/helpers';
import { ApiAddMasterSaveResp } from '@shared/authApiTypes';
import { z } from 'zod';
import consts from '@shared/consts';
const console = consoleFactory(modulename);

//Helper functions
const bodySchema = z.object({
    password: z.string().min(consts.adminPasswordMinLength).max(consts.adminPasswordMaxLength),
    discordId: z.string().optional(),
});
export type ApiAddMasterSaveReqSchema = z.infer<typeof bodySchema>;

/**
 * Handles the Add Master flow
 */
export default async function AuthAddMasterSave(ctx: InitializedCtx) {
    const schemaRes = bodySchema.safeParse(ctx.request.body);
    if (!schemaRes.success) {
        return ctx.send<ApiAddMasterSaveResp>({
            error: `Invalid request body: ${schemaRes.error.message}`,
        });
    }
    const { password, discordId } = schemaRes.data;

    //Check if there are already admins set up
    if (ctx.txAdmin.adminVault.hasAdmins()) {
        return ctx.send<ApiAddMasterSaveResp>({
            error: `master_already_set`,
        });
    }

    //Checking the discordId
    if (typeof discordId === 'string' && !consts.validIdentifierParts.discord.test(discordId)) {
        return ctx.send<ApiAddMasterSaveResp>({
            error: `Invalid Discord ID.`,
        });
    }

    //Checking if session is still present
    const inboundSession = ctx.sessTools.get();
    if (!inboundSession || !inboundSession?.tmpAddMasterUserInfo) {
        return ctx.send<ApiAddMasterSaveResp>({
            error: `Invalid browser session.`,
        });
    }
    const userInfo = inboundSession.tmpAddMasterUserInfo;

    //Getting identifier
    const fivemIdentifier = getIdFromOauthNameid(userInfo.nameid);
    if (!fivemIdentifier) {
        return ctx.send<ApiAddMasterSaveResp>({
            error: `Could not extract the user identifier from userInfo.nameid.\nPlease report this to the txAdmin dev team.\n${userInfo.nameid.toString()}`,
        });
    }

    //Create admins file and log in admin
    try {
        const vaultAdmin = ctx.txAdmin.adminVault.createAdminsFile(
            userInfo.name,
            fivemIdentifier,
            userInfo,
            password,
            true,
            discordId,
        );

        //If the user has a picture, save it to the cache
        if (userInfo.picture) {
            ctx.txAdmin.persistentCache.set(`admin:picture:${userInfo.name}`, userInfo.picture);
        }

        //Setting session
        const sessData = {
            type: 'cfxre',
            username: userInfo.name,
            csrfToken: ctx.txAdmin.adminVault.genCsrfToken(),
            expiresAt: Date.now() + 86_400_000, //24h,
            identifier: fivemIdentifier,
        } satisfies CfxreSessAuthType;
        ctx.sessTools.set({ auth: sessData });

        const authedAdmin = new AuthedAdmin(ctx.txAdmin, vaultAdmin, sessData.csrfToken);
        authedAdmin.logAction(`created admins file`);
        return ctx.send<ApiAddMasterSaveResp>(authedAdmin.getAuthData());
    } catch (error) {
        ctx.sessTools.destroy();
        console.error(`Failed to create session: ${(error as Error).message}`);
        return ctx.send<ApiAddMasterSaveResp>({
            error: `Failed to create session: ${(error as Error).message}`,
        });
    }
};
