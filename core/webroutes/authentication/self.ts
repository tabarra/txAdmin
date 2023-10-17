const modulename = 'WebServer:NUI';
import { AuthedCtx } from '@core/components/WebServer/ctxTypes';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);

/**
 * Method to check for the authentication, returning the admin object if it's valid.
 * This is used in the NUI auth and in the sv_admins.lua, as well as in the react web ui.
 */
export default async function AuthSelf(ctx: AuthedCtx) {
    //FIXME: maybe deprecate? was used to log nui menu auto authentications
    // ctx.admin.logAction('logged in via in-game ui');
    // ctx.txAdmin?.statisticsManager.loginOrigins.count('webpipe');
    // ctx.txAdmin?.statisticsManager.loginMethods.count('nui');

    ctx.send({
        name: ctx.admin.name,
        isMaster: ctx.admin.isMaster,
        permissions: ctx.admin.isMaster ? ['all_permissions'] : ctx.admin.permissions,
        isTempPassword: ctx.admin.isTempPassword,
        //FIXME: add pfp
    });
};
