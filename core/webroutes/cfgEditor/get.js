const modulename = 'WebServer:CFGEditorPage';
import { resolveCFGFilePath, readRawCFGFile } from '@core/extras/fxsConfigHelper';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);


/**
 * Returns the output page containing the server.cfg
 * @param {object} ctx
 */
export default async function CFGEditorPage(ctx) {
    //Check permissions
    if (!ctx.admin.hasPermission('server.cfg.editor')) {
        return ctx.utils.render('main/message', {message: 'You don\'t have permission to view this page.'});
    }

    //Check if file is set
    if (globals.fxRunner.config.cfgPath === null) {
        let message = 'Your CFG Path is not set. Configure it in the settings page first.';
        return ctx.utils.render('main/message', {message});
    }

    //Read cfg file
    let rawFile;
    try {
        let cfgFilePath = resolveCFGFilePath(globals.fxRunner.config.cfgPath, globals.fxRunner.config.serverDataPath);
        rawFile = await readRawCFGFile(cfgFilePath);
    } catch (error) {
        let message = `Failed to read CFG File with error: ${error.message}`;
        return ctx.utils.render('main/message', {message});
    }

    return ctx.utils.render('main/cfgEditor', {
        headerTitle: 'CFG Editor',
        rawFile,
        disableRestart: (ctx.admin.hasPermission('control.server')) ? '' : 'disabled',
    });
};
