const modulename = 'WebServer:NUI';
import logger from '@core/extras/console.js';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

/**
 * Return the permissions for the NUI auth.
 * This is called just by sv_admins.lua without
 * @param {object} ctx
 */
export default async function nuiAuth(ctx) {
    ctx.utils.logAction('logged in via in-game ui');
    globals.databus.txStatsData.login.origins.webpipe++;
    globals.databus.txStatsData.login.methods.nui++;

    ctx.send({
        isAdmin: true,
        username: ctx.nuiSession.auth.username,
        permissions: ctx.nuiSession.auth.master ? ['all_permissions'] : ctx.nuiSession.auth.permissions,
    });
};
