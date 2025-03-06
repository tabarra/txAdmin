const modulename = 'WebServer:SaveConfigFile';
import { validateModifyServerConfig } from '@lib/fxserver/fxsConfigHelper';
import consoleFactory from '@lib/console';
import type { AuthedCtx } from '@modules/WebServer/ctxTypes';
const console = consoleFactory(modulename);


/**
 * Saves the server.cfg
 */
export default async function SaveConfigFile(ctx: AuthedCtx) {
    throw new Error(`not implemented`);
};
