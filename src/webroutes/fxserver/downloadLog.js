//Requires
const modulename = 'WebServer:FXServerDownloadLog';
const fs = require('fs');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);


/**
 * Returns the console log file
 * @param {object} ctx
 */
module.exports = async function FXServerDownloadLog(ctx) {
    //Check permissions
    if (!ctx.utils.checkPermission('console.view', modulename)) {
        return ctx.utils.render('basic/generic', {message: 'You don\'t have permission to download this log.'});
    }

    let readFile;
    try {
        //NOTE: thy the fuck are errors from `createReadStream` not being caught? Well, using readFileSync for now...
        // readFile = fs.createReadStream(globals.fxRunner.config.logPath);
        readFile = fs.readFileSync(globals.fxRunner.config.logPath);
    } catch (error) {
        logError(`Could not read log file ${globals.fxRunner.config.logPath}.`);
    }
    const now = (new Date() / 1000).toFixed();
    ctx.attachment(`fxserver_${now}.log`);
    ctx.body = readFile;
    log(`[${ctx.session.auth.username}] Downloading console log file.`);
};
