//Requires
const modulename = 'WebServer:MasterActions:Get';
const fs = require('fs');
const path = require('path');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Helpers
const isUndefined = (x) => { return (typeof x === 'undefined'); };


/**
 * Handles the rendering or delivery of master action resources
 * @param {object} ctx
 */
module.exports = async function MasterActionsGet(ctx) {
    //Sanity check
    if (isUndefined(ctx.params.resource)) {
        return ctx.utils.error(400, 'Invalid Request');
    }
    const resource = ctx.params.resource;

    //Check permissions
    if (!ctx.utils.checkPermission('master', modulename)) {
        return ctx.utils.render('basic/generic', {message: 'Only the master account has permission to view/use this page.'});
    }

    //Render the page
    if (resource == 'importBans') {
        return ctx.utils.render('masterActions/importBans', {
            dbFilePathSuggestion: path.join(globals.fxRunner.config.serverDataPath, 'resources'),
        });
    } else if (resource == 'backupDatabase') {
        return handleBackupDatabase(ctx);
    } else {
        return ctx.utils.render('basic/404');
    }
};


//================================================================
/**
 * Handles the download of the players database
 * @param {object} ctx
 */
function handleBackupDatabase(ctx) {
    const dbPath = `${globals.info.serverProfilePath}/data/playersDB.json`;
    let readFile;
    try {
        readFile = fs.readFileSync(dbPath);
    } catch (error) {
        logError(`Could not read database file ${dbPath}.`);
    }
    const now = (new Date() / 1000).toFixed();
    ctx.attachment(`playersDB_${now}.json`);
    ctx.body = readFile;
    log(`[${ctx.session.auth.username}] Downloading player database.`);
}
