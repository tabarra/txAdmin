const modulename = 'WebServer:MasterActions:Page';
import logger from '@core/extras/console.js';
import { Context } from 'koa';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

/**
 * Handles the rendering or delivery of master action resources
 * @param {object} ctx
 */
export default async function MasterActionsPage(ctx: Context) {
    const isMasterAdmin = (ctx.utils.hasPermission('master'));
    return ctx.utils.render('main/masterActions', {
        headerTitle: 'Master Actions',
        isMasterAdmin,
        disableActions: (isMasterAdmin && ctx.txVars.isWebInterface) ? '' : 'disabled',
    });
};
