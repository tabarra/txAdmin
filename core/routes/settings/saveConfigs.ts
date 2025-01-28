const modulename = 'WebServer:SettingsPage';
import consoleFactory from '@lib/console';
import type { AuthedCtx } from '@modules/WebServer/ctxTypes';
import type { ApiToastResp } from '@shared/genericApiTypes';
import type { PartialTxConfigs } from '@modules/ConfigStore/schema';
import type { ConfigChangelogEntry } from '@shared/otherTypes';
const console = consoleFactory(modulename);


export type SaveConfigsReq = PartialTxConfigs;
export type SaveConfigsResp = ApiToastResp & {
    stored?: PartialTxConfigs;
    changelog?: ConfigChangelogEntry[];
};


/**
 * Returns the output page containing the live console
 */
export default async function SettingsPage(ctx: AuthedCtx) {
    const sendTypedResp = (data: SaveConfigsResp) => ctx.send(data);


    return sendTypedResp({
        type: 'error',
        md: true,
        title: 'ඞ',
        msg: 'check urself',
    });

    
    console.dir({
        params: ctx.params,
        body: ctx.request.body,
    });
    try {
        const storedKeysChanges = txCore.configStore.saveConfigs(ctx.request.body, ctx.admin.name);
        console.dir(storedKeysChanges.list);
        return sendTypedResp({
            type: 'success',
            msg: 'Settings saved!',
            stored: txCore.configStore.getStoredConfig(),
            changelog: txCore.configStore.getChangelog(),
        });
    } catch (error) {
        return sendTypedResp({
            type: 'error',
            md: true,
            title: 'Error saving settings',
            msg: (error as any).message,
        });
    }


    // //Sanity check
    // if (isUndefined(ctx.params.card)) {
    //     return ctx.utils.error(400, 'Invalid Request');
    // }
    // let card = ctx.params.card;

    // //Check permissions
    // if (!ctx.admin.testPermission('settings.write', modulename)) {
    //     return sendTypedResp({
    //         type: 'error',
    //         msg: 'You don\'t have permission to execute this action.',
    //     });
    // }

    // //Delegate to the specific card functions
    // if (card == 'global') {
    //     return await handleGlobal(ctx);
    // } else if (card == 'fxserver') {
    //     return await handleFXServer(ctx);
    // } else if (card == 'playerDatabase') {
    //     return await handlePlayerDatabase(ctx);
    // } else if (card == 'monitor') {
    //     return await handleMonitor(ctx);
    // } else if (card == 'discord') {
    //     return await handleDiscord(ctx);
    // } else if (card == 'menu') {
    //     return await handleMenu(ctx);
    // } else {
    //     return ctx.send({
    //         type: 'danger',
    //         message: 'Unknown settings card.',
    //     });
    // }
};
