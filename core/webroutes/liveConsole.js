const modulename = 'WebServer:LiveConsole';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);


/**
 * Returns the output page containing the live console
 * @param {object} ctx
 */
export default async function LiveConsole(ctx) {
    //Check permissions
    if (!ctx.admin.hasPermission('console.view')) {
        return ctx.utils.render('main/message', {message: 'You don\'t have permission to view this page.'});
    }

    const renderData = {
        headerTitle: 'Live Console',
        disableCommand: (ctx.admin.hasPermission('console.write')) ? 'autofocus' : 'disabled',
        disableAnnouncement: (ctx.admin.hasPermission('players.message')) ? '' : 'disabled',
        disableRestart: (ctx.admin.hasPermission('control.server')) ? '' : 'disabled',
    };

    return ctx.utils.render('main/console', renderData);
};
