const modulename = 'WebServer:CFGEditorSave';
import logger from '@core/extras/console.js';
import { validateModifyServerConfig } from '@core/extras/fxsConfigHelper';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined'); };


/**
 * Saves the server.cfg
 * @param {object} ctx
 */
export default async function CFGEditorSave(ctx) {
    //Sanity check
    if (
        isUndefined(ctx.request.body.cfgData)
        || typeof ctx.request.body.cfgData !== 'string'
    ) {
        return ctx.utils.error(400, 'Invalid Request');
    }

    //Check permissions
    if (!ctx.utils.checkPermission('server.cfg.editor', modulename)) {
        return ctx.send({
            type: 'danger',
            message: 'You don\'t have permission to execute this action.',
        });
    }

    //Check if file is set
    if (!globals.fxRunner.config.cfgPath || !globals.fxRunner.config.serverDataPath) {
        const message = 'CFG or Base Path not defined. Configure it in the settings page first.';
        return ctx.send({type: 'danger', message});
    }


    //Validating config contents + saving file and backup
    let result;
    try {
        result = await validateModifyServerConfig(
            ctx.request.body.cfgData,
            globals.fxRunner.config.cfgPath,
            globals.fxRunner.config.serverDataPath,
        );
    } catch (error) {
        return ctx.send({
            type: 'danger',
            markdown: true,
            message: `**Failed to save \`server.cfg\` with error:**\n${error.message}`,
        });
    }

    //Handle result
    if (result.errors) {
        return ctx.send({
            type: 'danger',
            markdown: true,
            message: `**Cannot save \`server.cfg\` due to error(s) in your config file(s):**\n${result.errors}`,
        });
    }
    if (result.warnings) {
        return ctx.send({
            type: 'warning',
            markdown: true,
            message: `**File saved, but there are warnings you should pay attention to:**\n${result.warnings}`,
        });
    }
    return ctx.send({
        type: 'success',
        markdown: true,
        message: '**File saved.**',
    });
};
