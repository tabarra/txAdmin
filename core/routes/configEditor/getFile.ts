const modulename = 'WebServer:GetConfigFile';
import fsp from 'node:fs/promises';
import { resolveCFGFilePath, readRawCFGFile } from '@lib/fxserver/fxsConfigHelper';
import consoleFactory from '@lib/console';
import type { AuthedCtx } from '@modules/WebServer/ctxTypes';
import type { GenericApiErrorResp } from '@shared/genericApiTypes';
import { getFsErrorMdMessage } from '@lib/fs';
const console = consoleFactory(modulename);


export type GetConfigFileResp = {
    isConfigured: true,
    filePath: string,
    fileData: string,
} | {
    isConfigured: false,
} | GenericApiErrorResp;

/**
 * Returns the resolved server.cfg file
 */
export default async function GetConfigFile(ctx: AuthedCtx) {
    const sendTypedResp = (data: GetConfigFileResp | GenericApiErrorResp) => ctx.send(data);

    //Check permissions
    if (!ctx.admin.hasPermission('server.cfg.editor')) {
        return sendTypedResp({ error: 'You don\'t have permission to view this page.' });
    }

    //Check if file is set
    const serverPaths = txCore.fxRunner.serverPaths;
    if (!serverPaths) {
        return sendTypedResp({ isConfigured: false });
    }

    //Read cfg file
    let rawFile;
    try {
        rawFile = await fsp.readFile(serverPaths.cfgPath, 'utf8');
    } catch (error) {
        const errMessage = getFsErrorMdMessage(error, serverPaths.cfgPath);
        return sendTypedResp({
            error: `Failed to read the config file with error: ${errMessage}`,
        });
    }

    //Send response
    return sendTypedResp({
        isConfigured: true,
        filePath: serverPaths.cfgPath,
        fileData: rawFile,
    });
};
