const modulename = 'WebServer:AuthGetIdentifiers';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import consoleFactory from '@lib/console';
import { z } from 'zod';
const console = consoleFactory(modulename);

//Helper functions
const bodySchema = z.object({
    oldPassword: z.string().optional(),
    newPassword: z.string(),
});
export type ApiChangePasswordReqSchema = z.infer<typeof bodySchema>;


/**
 * Returns the identifiers of the current admin
 */
export default async function AuthGetIdentifiers(ctx: AuthedCtx) {
    //Get vault admin
    const vaultAdmin = txCore.adminStore.getAdminByName(ctx.admin.name);
    if (!vaultAdmin) throw new Error('Wait, what? Where is that admin?');
    
    return ctx.send({
        cfxreId: (vaultAdmin.providers.citizenfx) ? vaultAdmin.providers.citizenfx.identifier : '',
        discordId: (vaultAdmin.providers.discord) ? vaultAdmin.providers.discord.identifier : '',
    });
};
