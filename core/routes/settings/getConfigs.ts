const modulename = 'WebServer:GetSettingsConfigs';
import localeMap from '@shared/localeMap';
import consoleFactory from '@lib/console';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import { GenericApiErrorResp } from '@shared/genericApiTypes';
import ConfigStore from '@modules/ConfigStore';
import { PartialTxConfigs, TxConfigs } from '@modules/ConfigStore/schema';
import { ConfigChangelogEntry } from '@modules/ConfigStore/changelog';
const console = consoleFactory(modulename);


export type GetConfigsResp = {
    locales: { code: string, label: string }[],
    // txDataPath: string,
    // txDataEnforced: boolean,
    changelog: ConfigChangelogEntry[],
    storedConfigs: PartialTxConfigs,
    defaultConfigs: TxConfigs,
}


/**
 * Returns the output page containing the live console
 */
export default async function GetSettingsConfigs(ctx: AuthedCtx) {
    const sendTypedResp = (data: GetConfigsResp | GenericApiErrorResp) => ctx.send(data);

    //Check permissions
    if (!ctx.admin.testPermission('settings.view', modulename)) {
        return sendTypedResp({
            error: 'You do not have permission to view the settings.'
        });
    }

    //Prepare data
    const locales = Object.keys(localeMap).map(code => ({
        code,
        label: localeMap[code].$meta.label,
    }));
    locales.sort((a, b) => a.label.localeCompare(b.label));

    const outData: GetConfigsResp = {
        locales,
        // txDataPath: txEnv.dataPath,
        // txDataEnforced: true,
        changelog: txCore.configStore.getChangelog(),
        storedConfigs: txCore.configStore.getStoredConfig(),
        defaultConfigs: ConfigStore.SchemaDefaults,
    };

    //Redact sensitive data if the user doesn't have the write permission
    if (!ctx.admin.hasPermission('settings.write')) {
        //FIXME:NC redact the keys from the startupArgs
        if(outData.storedConfigs.server?.startupArgs) {
            // outData.storedConfigs.server.startupArgs = redactApiKeys(outData.storedConfigs.server.startupArgs);
        }
        //FIXME:NC redact the discord bot token
        if(outData.storedConfigs.discordBot?.token) {
            // outData.storedConfigs.discordBot.token = '[redacted by txAdmin]';
        }
    }

    return sendTypedResp(outData);
};
