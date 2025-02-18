const modulename = 'WebServer:GetBanTemplates';
import consoleFactory from '@lib/console';
import { BanTemplatesDataType } from '@modules/ConfigStore/schema/banlist';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import { GenericApiErrorResp } from '@shared/genericApiTypes';
const console = consoleFactory(modulename);


//Response type
export type GetBanTemplatesSuccessResp = BanTemplatesDataType[];


/**
 * Retrieves the ban templates from the config file
 */
export default async function GetBanTemplates(ctx: AuthedCtx) {
    const sendTypedResp = (data: GetBanTemplatesSuccessResp | GenericApiErrorResp) => ctx.send(data);
    return sendTypedResp(txConfig.banlist.templates);
};
