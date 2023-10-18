const modulename = 'WebServer:MasterActions:Page';
import { AuthedCtx } from '@core/components/WebServer/ctxTypes';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);

/**
 * Handles the rendering or delivery of master action resources
 */
export default async function MasterActionsPage(ctx: AuthedCtx) {
    const isMasterAdmin = (ctx.admin.hasPermission('master'));
    return ctx.utils.render('main/masterActions', {
        headerTitle: 'Master Actions',
        isMasterAdmin,
        disableActions: (isMasterAdmin && ctx.txVars.isWebInterface) ? '' : 'disabled',
    });
};
