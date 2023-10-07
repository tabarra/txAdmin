const modulename = 'WebServer:MasterActions:Page';
import consoleFactory from '@extras/console';
import { WebCtx } from '@core/components/WebServer/ctxUtils';
const console = consoleFactory(modulename);

/**
 * Handles the rendering or delivery of master action resources
 * @param {object} ctx
 */
export default async function MasterActionsPage(ctx: WebCtx) {
    const isMasterAdmin = (ctx.utils.hasPermission('master'));
    return ctx.utils.render('main/masterActions', {
        headerTitle: 'Master Actions',
        isMasterAdmin,
        disableActions: (isMasterAdmin && ctx.txVars.isWebInterface) ? '' : 'disabled',
    });
};
