const modulename = 'WebServer:MasterActions:GetBackup';
import fsp from 'node:fs/promises';
import dateFormat from 'dateformat';
import { Context } from 'koa';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);


/**
 * Handles the rendering or delivery of master action resources
 * @param {object} ctx
 */
export default async function MasterActionsGet(ctx: Context) {
    //Check permissions
    if (!ctx.utils.testPermission('master', modulename)) {
        return ctx.utils.render('main/message', {message: 'Only the master account has permission to view/use this page.'});
    }
    if (!ctx.txVars.isWebInterface) {
        return ctx.utils.render('main/message', {message: 'This functionality cannot be used by the in-game menu, please use the web version of txAdmin.'});
    }

    const dbPath = `${globals.info.serverProfilePath}/data/playersDB.json`;
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
    console.log(`[${ctx.session.auth.username}] Downloading player database.`);
};
