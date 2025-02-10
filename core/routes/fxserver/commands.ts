const modulename = 'WebServer:FXServerCommands';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import consoleFactory from '@lib/console';
import { ApiToastResp } from '@shared/genericApiTypes';
import { txEnv } from '@core/globalData';
const console = consoleFactory(modulename);

//Helper functions
const delay = async (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};


/**
 * Handle all the server commands
 * @param {object} ctx
 */
export default async function FXServerCommands(ctx: AuthedCtx) {
    if (
        typeof ctx.request.body.action === 'undefined'
        || typeof ctx.request.body.parameter === 'undefined'
    ) {
        return ctx.send<ApiToastResp>({
            type: 'error',
            msg: 'Invalid request.',
        });
    }
    const action = ctx.request.body.action;
    const parameter = ctx.request.body.parameter;

    //Ignore commands when the server is offline
    if (!txCore.fxRunner.child?.isAlive) {
        return ctx.send<ApiToastResp>({
            type: 'error',
            msg: 'Cannot execute this action with the server offline.',
        });
    }

    //Block starting/restarting the 'runcode' resource
    const unsafeActions = ['restart_res', 'start_res', 'ensure_res'];
    if (unsafeActions.includes(action) && parameter.includes('runcode')) {
        return ctx.send<ApiToastResp>({
            type: 'error',
            msg: 'The resource "runcode" might be unsafe. <br> If you know what you are doing, run it via the Live Console.',
        });
    }


    //==============================================
    //DEBUG: Only available in the /advanced page
    //FIXME: move to the advanced route, give button for profiling, saving mem snapshot, verbose, etc.
    if (action == 'profile_monitor') {
        if (!ensurePermission(ctx, 'all_permissions')) return false;
        ctx.admin.logAction('Profiling txAdmin instance.');

        const profileDuration = 5;
        const savePath = `${txEnv.profilePath}/data/txProfile.bin`;
        ExecuteCommand('profiler record start');
        await delay(profileDuration * 1000);
        ExecuteCommand('profiler record stop');
        await delay(150);
        ExecuteCommand(`profiler save "${savePath}"`);
        await delay(150);
        console.ok(`Profile saved to: ${savePath}`);
        txCore.fxRunner.sendCommand('profiler', ['view', savePath], ctx.admin.name);
        return ctx.send<ApiToastResp>({
            type: 'success',
            msg: 'Check your live console in a few seconds.',
        });

    //==============================================
    } else if (action == 'admin_broadcast') {
        if (!ensurePermission(ctx, 'announcement')) return false;
        const message = (parameter ?? '').trim();

        // Dispatch `txAdmin:events:announcement`
        txCore.fxRunner.sendEvent('announcement', {
            message,
            author: ctx.admin.name,
        });
        ctx.admin.logAction(`Sending announcement: ${parameter}`);

        // Sending discord announcement
        const publicAuthor = txCore.adminStore.getAdminPublicName(ctx.admin.name, 'message');
        txCore.discordBot.sendAnnouncement({
            type: 'info',
            title: {
                key: 'nui_menu.misc.announcement_title',
                data: { author: publicAuthor }
            },
            description: message
        });

        return ctx.send<ApiToastResp>({
            type: 'success',
            msg: 'Announcement command sent.',
        });

    //==============================================
    } else if (action == 'kick_all') {
        if (!ensurePermission(ctx, 'control.server')) return false;
        const kickReason = (parameter ?? '').trim() || txCore.translator.t('kick_messages.unknown_reason');
        const fullReason = txCore.translator.t(
            'kick_messages.everyone',
            { reason: kickReason }
        );
        ctx.admin.logAction(`Kicking all players: ${kickReason}`);
        txCore.fxRunner.sendCommand('txaKickAll', [fullReason], ctx.admin.name);
        return ctx.send<ApiToastResp>({
            type: 'success',
            msg: 'Kick All command sent.',
        });

    //==============================================
    } else if (action == 'restart_res') {
        if (!ensurePermission(ctx, 'commands.resources')) return false;
        ctx.admin.logAction(`Restarted resource "${parameter}"`);
        txCore.fxRunner.sendCommand('restart', [parameter], ctx.admin.name);
        return ctx.send<ApiToastResp>({
            type: 'warning',
            msg: 'Resource restart command sent.',
        });

    //==============================================
    } else if (action == 'start_res') {
        if (!ensurePermission(ctx, 'commands.resources')) return false;
        ctx.admin.logAction(`Started resource "${parameter}"`);
        txCore.fxRunner.sendCommand('start', [parameter], ctx.admin.name);
        return ctx.send<ApiToastResp>({
            type: 'warning',
            msg: 'Resource start command sent.',
        });

    //==============================================
    } else if (action == 'ensure_res') {
        if (!ensurePermission(ctx, 'commands.resources')) return false;
        ctx.admin.logAction(`Ensured resource "${parameter}"`);
        txCore.fxRunner.sendCommand('ensure', [parameter], ctx.admin.name);
        return ctx.send<ApiToastResp>({
            type: 'warning',
            msg: 'Resource ensure command sent.',
        });

    //==============================================
    } else if (action == 'stop_res') {
        if (!ensurePermission(ctx, 'commands.resources')) return false;
        ctx.admin.logAction(`Stopped resource "${parameter}"`);
        txCore.fxRunner.sendCommand('stop', [parameter], ctx.admin.name);
        return ctx.send<ApiToastResp>({
            type: 'warning',
            msg: 'Resource stop command sent.',
        });

    //==============================================
    } else if (action == 'refresh_res') {
        if (!ensurePermission(ctx, 'commands.resources')) return false;
        ctx.admin.logAction(`Refreshed resources`);
        txCore.fxRunner.sendCommand('refresh', [], ctx.admin.name);
        return ctx.send<ApiToastResp>({
            type: 'warning',
            msg: 'Refresh command sent.',
        });

    //==============================================
    } else {
        return ctx.send<ApiToastResp>({
            type: 'error',
            msg: 'Unknown Action.',
        });
    }
};


//================================================================
/**
 * Wrapper function to check permission and give output if denied
 */
function ensurePermission(ctx: AuthedCtx, perm: string) {
    if (ctx.admin.testPermission(perm, modulename)) {
        return true;
    } else {
        ctx.send<ApiToastResp>({
            type: 'error',
            msg: 'You don\'t have permission to execute this action.',
        });
        return false;
    }
}
