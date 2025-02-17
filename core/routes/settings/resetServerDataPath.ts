const modulename = 'WebServer:SettingsPage';
import consoleFactory from '@lib/console';
import type { AuthedCtx } from '@modules/WebServer/ctxTypes';
import type { ApiToastResp } from '@shared/genericApiTypes';
import { SYM_RESET_CONFIG } from '@lib/symbols';
const console = consoleFactory(modulename);

export type ResetServerDataPathResp = ApiToastResp;

/**
 * Resets the server settings (was a master action)
 */
export default async function ResetServerDataPath(ctx: AuthedCtx) {
    const sendTypedResp = (data: ResetServerDataPathResp) => ctx.send(data);

    //Check permissions
    if (!ctx.admin.testPermission('all_permissions', modulename)) {
        return sendTypedResp({
            type: 'error',
            msg: 'You don\'t have permission to execute this action.',
        });
    }

    //Kill the server async
    if (!txCore.fxRunner.isIdle) {
        ctx.admin.logCommand('STOP SERVER');
        txCore.fxRunner.killServer('new server set up', ctx.admin.name, false).catch((e) => { });
    }

    //Making sure the deployer is not running
    txManager.deployer = null;

    //Preparing & saving config
    try {
        txCore.configStore.saveConfigs({
            server: {
                dataPath: SYM_RESET_CONFIG,
                cfgPath: SYM_RESET_CONFIG,
            }
        }, ctx.admin.name);
    } catch (error) {
        console.warn(`[${ctx.admin.name}] Error resetting server data settings.`);
        console.verbose.dir(error);
        return sendTypedResp({
            type: 'error',
            md: true,
            title: `Error resetting the server data path.`,
            msg: (error as any).message,
        });
    }

    //technically not required, but faster than fxRunner.killServer()
    txCore.webServer.webSocket.pushRefresh('status');

    //Sending output
    ctx.admin.logAction('Resetting server data settings.');
    return sendTypedResp({
        type: 'success',
        msg: 'Server data path reset.'
    });
};
