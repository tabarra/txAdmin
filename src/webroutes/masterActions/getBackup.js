//Requires
const modulename = 'WebServer:MasterActions:GetBackup';
const fsp = require('fs').promises;
const dateFormat = require('dateformat');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);


/**
 * Handles the rendering or delivery of master action resources
 * @param {object} ctx
 */
module.exports = async function MasterActionsGet(ctx) {
    //Check permissions
    if (!ctx.utils.checkPermission('master', modulename)) {
        return ctx.utils.render('basic/generic', {message: 'Only the master account has permission to view/use this page.'});
    }
    if (!ctx.txVars.isWebInterface) {
        return ctx.utils.render('basic/generic', {message: 'This functionality cannot be used by the in-game menu, please use the web version of txAdmin.'});
    }

    const dbPath = `${globals.info.serverProfilePath}/data/playersDB.json`;
    let readFile;
    try {
        readFile = await fsp.readFile(dbPath);
    } catch (error) {
        logError(`Could not read database file ${dbPath}.`);
        return ctx.utils.render('basic/generic', {message: `Failed to generate backup file with error: ${error.message}`});
    }
    const now = dateFormat(new Date(), 'yyyy-mm-dd_HH-MM-ss');
    ctx.attachment(`playersDB_${now}.json`);
    ctx.body = readFile;
    log(`[${ctx.session.auth.username}] Downloading player database.`);
};
