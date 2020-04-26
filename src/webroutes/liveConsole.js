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

    let renderData = {
        headerTitle: 'Console',
        disableWrite: (ctx.utils.checkPermission('console.write', modulename))? 'autofocus' : 'disabled'
    }

    return ctx.utils.render('console', renderData);
};
