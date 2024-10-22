const modulename = 'WebServer:AuthSelf';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import consoleFactory from '@lib/console';
import { ReactAuthDataType } from '@shared/authApiTypes';
const console = consoleFactory(modulename);

/**
 * Method to check for the authentication, returning the admin object if it's valid.
 * This is used in the NUI auth and in the sv_admins.lua, as well as in the react web ui.
 */
export default async function AuthSelf(ctx: AuthedCtx) {
    ctx.send<ReactAuthDataType>(ctx.admin.getAuthData());
};
