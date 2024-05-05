const modulename = 'WebServer:GetBanTemplates';
import consoleFactory from '@extras/console';
import { AuthedCtx } from '@core/components/WebServer/ctxTypes';
import { GenericApiErrorResp } from '@shared/genericApiTypes';
import { BanTemplatesDataSchema, BanTemplatesDataType } from './utils';
const console = consoleFactory(modulename);


//Response type
export type GetBanTemplatesSuccessResp = BanTemplatesDataType[];

/**
 * Retrieves the ban templates from the config file
 * NOTE: i'm doing validation here because really nowhere else to do at boot time
 */
export default async function GetBanTemplates(ctx: AuthedCtx) {
    const sendTypedResp = (data: GetBanTemplatesSuccessResp | GenericApiErrorResp) => ctx.send(data);
    const savedTemplates = ctx.txAdmin.configVault.getScopedStructure('banTemplates');

    //Validating saved data
    if (!Array.isArray(savedTemplates)) {
        console.error(
            'Invalid ban templates data. Expected array, got:',
            typeof savedTemplates,
        );
        return sendTypedResp([]);
    }

    const filteredTemplates = (savedTemplates as unknown[]).filter((template): template is BanTemplatesDataType => {
        const isValid = BanTemplatesDataSchema.safeParse(template);
        if (!isValid.success) {
            console.error(
                'Invalid ban template:',
                JSON.stringify(template)
            );
            return false;
        }
        return true;
    });

    return sendTypedResp(filteredTemplates);
};
