const modulename = 'WebServer:AdvancedPage';
import consoleFactory from '@lib/console';
const console = consoleFactory(modulename);


/**
 * Returns the output page containing the server.cfg
 * @param {object} ctx
 */
export default async function AdvancedPage(ctx) {
    //Check permissions
    if (!ctx.admin.hasPermission('all_permisisons')) {
        return ctx.utils.render('main/message', {message: 'You don\'t have permission to view this page.'});
    }

    return ctx.utils.render('main/advanced', {
        headerTitle: 'Advanced',
        verbosityEnabled: console.isVerbose,
    });
};
