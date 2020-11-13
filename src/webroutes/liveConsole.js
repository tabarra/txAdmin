//Requires
const modulename = 'WebServer:LiveConsole';
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);


/**
 * Returns the output page containing the live console
 * @param {object} ctx
 */
module.exports = async function LiveConsole(ctx) {
    //Check permissions
    if(!ctx.utils.checkPermission('console.view', modulename)){
        return ctx.utils.render('basic/generic', {message: `You don't have permission to view this page.`});
    }

    const renderData = {
        headerTitle: 'Console',
        disableCommand: (ctx.utils.checkPermission('console.write', modulename, false))? 'autofocus' : 'disabled',
        disableRestart: (ctx.utils.checkPermission('control.server', modulename, false))? '' : 'disabled',
        restartBtnClass: (ctx.utils.checkPermission('control.server', modulename, false))? 'danger' : 'secondary',
    }

    return ctx.utils.render('console', renderData);
};
