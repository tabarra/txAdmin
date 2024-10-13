const modulename = 'WebServer:FXServerDownloadLog';
import fs from 'node:fs';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);


/**
 * Returns the console log file
 * @param {object} ctx
 */
export default async function FXServerDownloadLog(ctx) {
    //Check permissions
    if (!ctx.admin.testPermission('console.view', modulename)) {
        return ctx.utils.render('main/message', {message: 'You don\'t have permission to download this log.'});
    }

    let readFile;
    try {
        //NOTE: why the fuck are errors from `createReadStream` not being caught? Well, using readFileSync for now...
        // readFile = fs.createReadStream(globals.fxRunner.config.logPath);
        readFile = fs.readFileSync(globals.fxRunner.config.logPath);
    } catch (error) {
        console.error(`Could not read log file ${globals.fxRunner.config.logPath}.`);
    }
    const now = (new Date() / 1000).toFixed();
    ctx.attachment(`fxserver_${now}.log`);
    ctx.body = readFile;
    console.log(`[${ctx.admin.name}] Downloading console log file.`);
};
