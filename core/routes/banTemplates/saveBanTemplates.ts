const modulename = 'WebServer:SaveBanTemplates';
import consoleFactory from '@lib/console';
import { BanTemplatesDataType } from '@modules/ConfigStore/schema/banlist';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import { GenericApiOkResp } from '@shared/genericApiTypes';
import { z } from 'zod';
const console = consoleFactory(modulename);


//Req validation & types
const bodySchema = z.any().array();
export type SaveBanTemplatesReq = BanTemplatesDataType[];
export type SaveBanTemplatesResp = GenericApiOkResp;


/**
 * Saves the ban templates to the config file
 */
export default async function SaveBanTemplates(ctx: AuthedCtx) {
    const sendTypedResp = (data: SaveBanTemplatesResp) => ctx.send(data);

    //Check permissions
    if (!ctx.admin.testPermission('settings.write', modulename)) {
        return sendTypedResp({
            error: 'You do not have permission to change the settings.'
        });
    }

    //Validating input
    const schemaRes = bodySchema.safeParse(ctx.request.body);
    if (!schemaRes.success) {
        return sendTypedResp({
            error: `Invalid request body: ${schemaRes.error.message}`,
        });
    }
    const banTemplates = schemaRes.data;

    //Preparing & saving config
    try {
        txCore.configStore.saveConfigs({
            banlist: { templates: banTemplates },
        }, ctx.admin.name);
    } catch (error) {
        console.warn(`[${ctx.admin.name}] Error changing banTemplates settings.`);
        console.verbose.dir(error);
        return sendTypedResp({
            error: `Error saving the configuration file: ${(error as Error).message}`
        });
    }

    //Sending output
    return sendTypedResp({ success: true });
};
