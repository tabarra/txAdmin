const modulename = 'WebServer:SaveBanTemplates';
import consoleFactory from '@extras/console';
import { AuthedCtx } from '@core/components/WebServer/ctxTypes';
import { GenericApiOkResp } from '@shared/genericApiTypes';
import { z } from 'zod';
import { BanTemplatesDataSchema, BanTemplatesDataType } from './utils';
const console = consoleFactory(modulename);


//Req validation & types
const bodySchema = z.array(BanTemplatesDataSchema);
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

    //Dropping duplicates
    const filteredBanTemplates = banTemplates.filter((template, index) => {
        return banTemplates.findIndex((t) => t.id === template.id) === index;
    });

    //Preparing & saving config
    try {
        ctx.txAdmin.configVault.saveProfile('banTemplates', filteredBanTemplates);
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
