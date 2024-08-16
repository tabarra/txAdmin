const modulename = 'WebServer:GetBanTemplates';
import consoleFactory from '@extras/console';
import { AuthedCtx } from '@core/components/WebServer/ctxTypes';
import { GenericApiErrorResp } from '@shared/genericApiTypes';
import { BanTemplatesDataSchema, BanTemplatesDataType } from './utils';
const console = consoleFactory(modulename);


//Response type
export type GetBanTemplatesSuccessResp = BanTemplatesDataType[];


/**
 * NOTE: Extracted this from the default export to be able to use it in player modal
 * NOTE: i'm doing validation here because really nowhere else to do at boot time
 */
export const getBanTemplatesImpl = (ctx: AuthedCtx): BanTemplatesDataType[] => {
    const savedTemplates = ctx.txAdmin.configVault.getScopedStructure('banTemplates');

    //Validating saved data
    if (!Array.isArray(savedTemplates)) {
        console.error(
            'Invalid ban templates data. Expected array, got:',
            typeof savedTemplates,
        );
        return [];
    }

    //Filtering valid & unique templates
    const filteredTemplates = (savedTemplates as unknown[]).filter((template, index): template is BanTemplatesDataType => {
        const isValid = BanTemplatesDataSchema.safeParse(template);
        if (!isValid.success) {
            console.error(
                'Invalid ban template:',
                JSON.stringify(template)
            );
            return false;
        }
        const isUnique = savedTemplates.findIndex((t) => t.id === isValid.data.id) === index;
        if (!isUnique) {
            console.error(
                'Duplicate ban template id:',
                isValid.data.id
            );
            return false;
        }
        return true;
    });

    return filteredTemplates;
}


/**
 * Retrieves the ban templates from the config file
 */
export default async function GetBanTemplates(ctx: AuthedCtx) {
    const sendTypedResp = (data: GetBanTemplatesSuccessResp | GenericApiErrorResp) => ctx.send(data);
    const templates = getBanTemplatesImpl(ctx);

    return sendTypedResp(templates);
};
