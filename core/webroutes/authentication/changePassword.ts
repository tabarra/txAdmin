const modulename = 'WebServer:AuthChangePassword';
import { AuthedCtx } from '@core/components/WebServer/ctxTypes';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);

//Helper functions

/**
 * Returns the output page containing the admins.
 */
export default async function AuthChangePassword(ctx: AuthedCtx) {
    //Sanity check
    if (typeof ctx.request?.body?.newPassword !== 'string') {
        return ctx.utils.error(400, 'Invalid Request');
    }

    //Check if temp password
    if (!ctx.admin.isTempPassword && typeof ctx.request.body.oldPassword !== 'string') {
        return ctx.send({type: 'danger', message: 'The permanent password was already set.'});
    }

    //Validate fields
    const newPassword = ctx.request.body.newPassword.trim();
    if (!ctx.admin.isTempPassword && ctx.request.body?.oldPassword !== undefined) {
        const vaultAdmin = ctx.txAdmin.adminVault.getAdminByName(ctx.admin.name);
        if (!vaultAdmin) throw new Error('Wait, what? Where is that admin?');
        const oldPassword = ctx.request.body.oldPassword.trim();
        if (!VerifyPasswordHash(oldPassword, vaultAdmin.password_hash)) {
            return ctx.send({type: 'danger', message: 'Wrong current password'});
        }
    }
    if (newPassword.length < 6 || newPassword.length > 32) {
        return ctx.send({type: 'danger', message: 'Invalid new password'});
    }

    //Add admin and give output
    try {
        const newHash = await ctx.txAdmin.adminVault.editAdmin(ctx.admin.name, newPassword);

        //Update session hash if logged in via password
        const currSess = ctx.sessTools.get();
        if(currSess?.auth?.type === 'password') {
            ctx.sessTools.set({
                auth: {
                    ...currSess.auth,
                    password_hash: newHash,
                }
            });
        }

        ctx.admin.logAction('Changing own password.');
        return ctx.send({type: 'success', message: 'Password changed successfully'});
    } catch (error) {
        return ctx.send({type: 'danger', message: (error as Error).message});
    }
};
