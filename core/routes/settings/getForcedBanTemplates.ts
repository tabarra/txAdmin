const modulename = 'WebServer:GetForcedBanTemplates';
import consoleFactory from "@lib/console";
import { AuthedCtx } from "@modules/WebServer/ctxTypes";
import { GenericApiErrorResp } from "@shared/genericApiTypes";
const console = consoleFactory(modulename);

export type GetForcedBanTemplatesResp = {
    forceBanTemplates: boolean,
}

/**
 * Returns if the admins are forced to use the ban templates
 */
export default async function GetForcedBanTemplates(ctx: AuthedCtx) {
    const sendTypedResp = (data: GetForcedBanTemplatesResp | GenericApiErrorResp) => ctx.send(data);

    //Prepare data
    const outData: GetForcedBanTemplatesResp = {
        forceBanTemplates: txCore.configStore.getStoredConfig().gameFeatures?.forceBanTemplates || false,
    };

    return sendTypedResp(outData);
};