const modulename = 'WebServer:FXServerCommands';
import { AuthedCtx } from '@core/components/WebServer/ctxTypes';
import consoleFactory from '@extras/console';
import { ApiToastResp } from '@shared/genericApiTypes';
const console = consoleFactory(modulename);

//Helper functions
const escape = (x: string) => {return x.replace(/"/g, '\uff02');};
const formatCommand = (cmd: string, ...params: string[]) => {
    return `${cmd} "` + [...params].map(escape).join('" "') + '"';
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
    const fxRunner = ctx.txAdmin.fxRunner;

    //Ignore commands when the server is offline
    if (fxRunner.fxChild === null) {
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
    if (action == 'profile_monitor') {
        if (!ensurePermission(ctx, 'all_permissions')) return false;
        ctx.admin.logAction('Profiling txAdmin instance.');

        const profileDuration = 5;
        const savePath = `${ctx.txAdmin.info.serverProfilePath}/data/txProfile.bin`;
        ExecuteCommand('profiler record start');
        setTimeout(async () => {
            ExecuteCommand('profiler record stop');
            setTimeout(async () => {
                ExecuteCommand(`profiler save "${escape(savePath)}"`);
                setTimeout(async () => {
                    console.ok(`Profile saved to: ${savePath}`);
                    fxRunner.srvCmd(`profiler view "${escape(savePath)}"`, ctx.admin.name);
                }, 150);
            }, 150);
        }, profileDuration * 1000);
        return ctx.send<ApiToastResp>({
            type: 'success',
            msg: 'Check your live console in a few seconds.',
        });

    //==============================================
    } else if (action == 'admin_broadcast') {
        if (!ensurePermission(ctx, 'players.message')) return false;
        const message = (parameter ?? '').trim();

        // Dispatch `txAdmin:events:announcement`
        fxRunner.sendEvent('announcement', {
            message,
            author: ctx.admin.name,
        });
        ctx.admin.logAction(`Sending announcement: ${parameter}`);

        // Sending discord announcement
        ctx.txAdmin.discordBot.sendAnnouncement({
            type: 'info',
            title: {
                key: 'nui_menu.misc.announcement_title',
                data: {author: ctx.admin.name}
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
        let cmd;
        if (parameter.length) {
            cmd = formatCommand('txaKickAll', parameter);
        } else {
            cmd = 'txaKickAll "txAdmin Web Panel"';
        }
        ctx.admin.logCommand(cmd);
        fxRunner.srvCmd(cmd, ctx.admin.name);
        return ctx.send<ApiToastResp>({
            type: 'success',
            msg: 'Kick All command sent.',
        });

    //==============================================
    } else if (action == 'restart_res') {
        if (!ensurePermission(ctx, 'commands.resources')) return false;
        const cmd = formatCommand('restart', parameter);
        ctx.admin.logCommand(cmd);
        fxRunner.srvCmd(cmd, ctx.admin.name);
        return ctx.send<ApiToastResp>({
            type: 'warning',
            msg: 'Resource restart command sent.',
        });

    //==============================================
    } else if (action == 'start_res') {
        if (!ensurePermission(ctx, 'commands.resources')) return false;
        const cmd = formatCommand('start', parameter);
        ctx.admin.logCommand(cmd);
        fxRunner.srvCmd(cmd, ctx.admin.name);
        return ctx.send<ApiToastResp>({
            type: 'warning',
            msg: 'Resource start command sent.',
        });

    //==============================================
    } else if (action == 'ensure_res') {
        if (!ensurePermission(ctx, 'commands.resources')) return false;
        const cmd = formatCommand('ensure', parameter);
        ctx.admin.logCommand(cmd);
        fxRunner.srvCmd(cmd, ctx.admin.name);
        return ctx.send<ApiToastResp>({
            type: 'warning',
            msg: 'Resource ensure command sent.',
        });

    //==============================================
    } else if (action == 'stop_res') {
        if (!ensurePermission(ctx, 'commands.resources')) return false;
        const cmd = formatCommand('stop', parameter);
        ctx.admin.logCommand(cmd);
        fxRunner.srvCmd(cmd, ctx.admin.name);
        return ctx.send<ApiToastResp>({
            type: 'warning',
            msg: 'Resource stop command sent.',
        });

    //==============================================
    } else if (action == 'refresh_res') {
        if (!ensurePermission(ctx, 'commands.resources')) return false;
        const cmd = 'refresh';
        ctx.admin.logCommand(cmd);
        fxRunner.srvCmd(cmd, ctx.admin.name);
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
