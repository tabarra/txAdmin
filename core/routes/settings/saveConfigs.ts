const modulename = 'WebServer:SettingsPage';
import consoleFactory from '@lib/console';
import fsp from 'node:fs/promises';
import path from 'node:path';
import slash from 'slash';
import type { AuthedCtx } from '@modules/WebServer/ctxTypes';
import type { ApiToastResp } from '@shared/genericApiTypes';
import type { PartialTxConfigs, PartialTxConfigsToSave } from '@modules/ConfigStore/schema';
import type { ConfigChangelogEntry } from '@shared/otherTypes';
import { z } from 'zod';
import { fromError } from 'zod-validation-error';
import Translator, { localeFileSchema } from '@modules/Translator';
import ConfigStore from '@modules/ConfigStore';
import { resolveCFGFilePath } from '@lib/fxserver/fxsConfigHelper';
import { txEnv } from '@core/globalData';
const console = consoleFactory(modulename);


//Types
export type SaveConfigsReq = PartialTxConfigs;
export type SaveConfigsResp = ApiToastResp & {
    stored?: PartialTxConfigs;
    changelog?: ConfigChangelogEntry[];
};

type SendTypedResp = (data: SaveConfigsResp) => void;
type CardHandlerSuccessResp = {
    processedConfig: PartialTxConfigsToSave;
    successToast?: ApiToastResp;
}
type CardHandler = (
    inputConfig: PartialTxConfigsToSave,
    sendTypedResp: SendTypedResp
) => Promise<CardHandlerSuccessResp | void>;

//Known cards
const cardNamesMap = {
    general: 'General',
    fxserver: 'FXServer',
    bans: 'Bans',
    whitelist: 'Whitelist',
    discord: 'Discord',
    'game-menu': 'Game Menu',
    'game-notifications': 'Game Notifications',
} as const;
const validCardIds = Object.keys(cardNamesMap) as [keyof typeof cardNamesMap];

//Req validation
const paramsSchema = z.object({ card: z.enum(validCardIds) });
const bodySchema = z.object({}).passthrough();

//Helper to clean paths
const cleanPath = (x: string) => slash(path.normalize(x));


/**
 * Returns the output page containing the live console
 * NOTE: the UI trims all strings
 */
export default async function SettingsPage(ctx: AuthedCtx) {
    const sendTypedResp = (data: SaveConfigsResp) => ctx.send(data);

    //Check permissions
    if (!ctx.admin.testPermission('settings.write', modulename)) {
        return sendTypedResp({
            type: 'error',
            msg: 'You don\'t have permission to execute this action.',
        });
    }

    //Validating input
    const paramsSchemaRes = paramsSchema.safeParse(ctx.params);
    const bodySchemaRes = bodySchema.safeParse(ctx.request.body);
    if (!paramsSchemaRes.success || !bodySchemaRes.success) {
        return sendTypedResp({
            type: 'error',
            md: true,
            title: 'Invalid Request',
            msg: fromError(
                paramsSchemaRes.error ?? bodySchemaRes.error,
                { prefix: null }
            ).message,
        });
    }
    const cardId = paramsSchemaRes.data.card;
    const inputConfig = bodySchemaRes.data;
    const cardName = cardNamesMap[ctx.params.card as keyof typeof cardNamesMap] ?? 'UNKNOWN';

    //Delegate to the specific card handlers - if required
    let handlerResp: CardHandlerSuccessResp | void = { processedConfig: inputConfig };
    try {
        if (cardId === 'general') {
            handlerResp = await handleGeneralCard(inputConfig, sendTypedResp);
        } else if (cardId === 'fxserver') {
            handlerResp = await handleFxserverCard(inputConfig, sendTypedResp);
        } else if (cardId === 'discord') {
            handlerResp = await handleDiscordCard(inputConfig, sendTypedResp);
        }
    } catch (error) {
        return sendTypedResp({
            type: 'error',
            md: true,
            title: `Error processing the ${cardName} changes.`,
            msg: (error as any).message,
        });
    }
    if (!handlerResp) return; //resp already sent


    //Save the changes
    try {
        const storedKeysChanges = txCore.configStore.saveConfigs(ctx.request.body, ctx.admin.name);
        console.dir(storedKeysChanges.list);
        return sendTypedResp({
            type: 'success',
            msg: `${cardName} Settings saved!`,
            ...(handlerResp?.successToast ?? {}),
            stored: txCore.configStore.getStoredConfig(),
            changelog: txCore.configStore.getChangelog(),
        });
    } catch (error) {
        const cardName = cardNamesMap[ctx.params.card as keyof typeof cardNamesMap] ?? 'UNKNOWN';
        return sendTypedResp({
            type: 'error',
            md: true,
            title: `Error saving the ${cardName} changes.`,
            msg: (error as any).message,
        });
    }
};


/**
 * General card handler
 */
const handleGeneralCard: CardHandler = async (inputConfig, sendTypedResp) => {
    //Validates custom language file
    if (inputConfig.general?.language === undefined) throw new Error(`Unexpected data for the 'general' card.`);
    if (inputConfig.general.language === 'custom') {
        try {
            const raw = await fsp.readFile(txCore.translator.customLocalePath, 'utf8');
            if (!raw.length) throw new Error('The \`locale.json\` file is empty.');
            const parsed = JSON.parse(raw);
            const locale = localeFileSchema.parse(parsed);
            if (!Translator.humanizerLanguages.includes(locale.$meta.humanizer_language)) {
                throw new Error(`Invalid humanizer language: \`${locale.$meta.humanizer_language}\`.`);
            }
        } catch (error) {
            let msg = (error as Error).message;
            if (error instanceof Error) {
                if (error.message.includes('ENOENT')) {
                    msg = `Could not find the custom language file:\n\`${txCore.translator.customLocalePath}\``;
                } else if (error.message.includes('JSON')) {
                    msg = 'The custom language file contains invalid JSON.';
                } else if (error instanceof z.ZodError) {
                    msg = fromError(error, { prefix: 'Invalid Locale Metadata' }).message;
                }
            }
            return sendTypedResp({
                type: 'error',
                title: 'Custom Language Error',
                md: true,
                msg,
            });
        }
    }

    return { processedConfig: inputConfig };
}


/**
 * FXServer card handler
 * TODO: support nulling the dataPath
 */
const handleFxserverCard: CardHandler = async (inputConfig, sendTypedResp) => {
    // if (typeof inputConfig.server?.dataPath === 'string' && inputConfig.server.dataPath.length) {
    //     inputConfig.server.dataPath = cleanPath(inputConfig.server.dataPath + '/');
    // }
    if (typeof inputConfig.server?.dataPath !== 'string' || !inputConfig.server?.dataPath.length) {
        throw new Error(`Unexpected data for the 'fxserver' card.`);
    }

    const dataPath = inputConfig.server.dataPath;
    let cfgPath = txConfig.server.cfgPath;
    if (inputConfig.server?.cfgPath !== undefined) {
        const res = ConfigStore.Schema.server.cfgPath.validator.safeParse(inputConfig.server.cfgPath);
        if (!res.success) {
            return sendTypedResp({
                type: 'error',
                title: 'Invalid CFG Path',
                md: true,
                msg: fromError(res.error, { prefix: null }).message,
            });
        }
        cfgPath = res.data;
    }

    //Validating Server Data Path
    try {
        const resPath = path.join(dataPath, 'resources');
        const resStat = await fsp.stat(resPath);
        if (!resStat.isDirectory()) {
            throw new Error("Couldn't locate or read a resources folder inside of the server data path.");
        }
    } catch (err) {
        const error = err as Error;
        let msg = error.message;
        if (dataPath.includes('resources')) {
            msg = `Looks like this path is the \`resources\` folder, but the server data path must be the folder that contains the resources folder instead of the resources folder itself.\n**Try removing the \`resources\` part at the end of the path.**`;
        } else if (!txEnv.isWindows && /^[a-zA-Z]:[\\/]/.test(dataPath)) {
            msg = `Looks like you're using a Windows path on a Linux server.\nThis likely means you are attempting to use a path from your Windows machine on a remote server.\nIf you want to use your local files, you will first need to upload them to the server.`;
        } else if (error.message?.includes('ENOENT')) {
            msg = `The path provided does not exist:\n\`${dataPath}\``;
        } else if (error.message?.includes('EACCES') || error.message?.includes('EPERM')) {
            msg = `The path provided is not accessible:\n\`${dataPath}\``;
        }
        return sendTypedResp({
            type: 'error',
            title: 'Server Data Folder Error',
            md: true,
            msg,
        });
    }

    //Validating CFG Path
    try {
        const cfgFilePath = resolveCFGFilePath(cfgPath, dataPath);
        const cfgFileStat = await fsp.stat(cfgFilePath);
        if (!cfgFileStat.isFile()) {
            throw new Error('The path provided is not a file');
        }
    } catch (err) {
        const error = err as Error;
        let msg = error.message;
        if (error.message?.includes('ENOENT')) {
            msg = `The path provided does not exist:\n\`${dataPath}\``;
        } else if (error.message?.includes('EACCES') || error.message?.includes('EPERM')) {
            msg = `The path provided is not accessible:\n\`${dataPath}\``;
        }
        return sendTypedResp({
            type: 'error',
            title: 'CFG Path Error',
            md: true,
            msg,
        });
    }

    //Final cleanup
    if (typeof inputConfig.server?.cfgPath === 'string') {
        inputConfig.server.cfgPath = cleanPath(inputConfig.server.cfgPath);
    }

    return {
        processedConfig: inputConfig,
        successToast: {
            type: 'success',
            title: 'FXServer Settings Saved!',
            msg: 'You need to restart the server for the changes to take effect.',
        }
    };
}


/**
 * Discord card handler
 */
const handleDiscordCard: CardHandler = async (inputConfig, sendTypedResp) => {
    return undefined; //FIXME: implement
}
