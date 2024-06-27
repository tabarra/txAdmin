const modulename = 'WebServer:MasterActions:GetBackup';
import fsp from 'node:fs/promises';
import dateFormat from 'dateformat';
import consoleFactory from '@extras/console';
import { AuthedCtx } from '@core/components/WebServer/ctxTypes';
const console = consoleFactory(modulename);


/**
 * Handles the rendering or delivery of master action resources
 */
export default async function MasterActionsGet(ctx: AuthedCtx) {
    //Check permissions
    if (!ctx.admin.testPermission('master', modulename)) {
        return ctx.utils.render('main/message', {message: 'Only the master account has permission to view/use this page.'});
    }
    if (!ctx.txVars.isWebInterface) {
        return ctx.utils.render('main/message', {message: 'This functionality cannot be used by the in-game menu, please use the web version of txAdmin.'});
    }

    const dbPath = `${ctx.txAdmin.info.serverProfilePath}/data/playersDB.json`;
    let readFile;
    try {
        readFile = await fsp.readFile(dbPath);
    } catch (error) {
        console.error(`Could not read database file ${dbPath}.`);
        return ctx.utils.render('main/message', {message: `Failed to generate backup file with error: ${(error as Error).message}`});
    }
    const now = dateFormat(new Date(), 'yyyy-mm-dd_HH-MM-ss');
    ctx.attachment(`playersDB_${now}.json`);
    ctx.body = readFile;
    console.log(`[${ctx.admin.name}] Downloading player database.`);
};
