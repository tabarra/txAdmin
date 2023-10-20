const modulename = 'WebServer:AuthSelf';
import { AuthedCtx } from '@core/components/WebServer/ctxTypes';
import consoleFactory from '@extras/console';
import { ReactPreauthType } from '@shared/InjectedTxConstsType';
const console = consoleFactory(modulename);

/**
 * Method to check for the authentication, returning the admin object if it's valid.
 * This is used in the NUI auth and in the sv_admins.lua, as well as in the react web ui.
 */
export default async function AuthSelf(ctx: AuthedCtx) {
    const outData = {
        name: ctx.admin.name,
        permissions: ctx.admin.isMaster ? ['all_permissions'] : ctx.admin.permissions,
        isMaster: ctx.admin.isMaster,
        isTempPassword: ctx.admin.isTempPassword,
        profilePicture: ctx.admin.profilePicture,
        csrfToken: ctx.admin.csrfToken ?? 'not_set',
    } satisfies ReactPreauthType;

    ctx.send(outData);
};
