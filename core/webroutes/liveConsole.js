const modulename = 'WebServer:LiveConsole';
import logger from '@core/extras/console.js';
const { dir, log, logOk, logWarn, logError } = logger(modulename);


/**
 * Returns the output page containing the live console
 * @param {object} ctx
 */
export default async function LiveConsole(ctx) {
    //Check permissions
    if (!ctx.utils.checkPermission('console.view', modulename)) {
        return ctx.utils.render('main/message', {message: 'You don\'t have permission to view this page.'});
    }

    const renderData = {
        headerTitle: 'Live Console',
        disableCommand: (ctx.utils.checkPermission('console.write', modulename, false)) ? 'autofocus' : 'disabled',
        disableAnnouncement: (ctx.utils.checkPermission('players.message', modulename, false)) ? '' : 'disabled',
        disableRestart: (ctx.utils.checkPermission('control.server', modulename, false)) ? '' : 'disabled',
    };

    return ctx.utils.render('main/console', renderData);
};
