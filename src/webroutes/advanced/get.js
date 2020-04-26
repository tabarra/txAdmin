//Requires
const modulename = 'WebServer:AdvancedGet';
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const helpers = require('../../extras/helpers');


/**
 * Returns the output page containing the server.cfg
 * @param {object} ctx
 */
module.exports = async function AdvancedGet(ctx) {
    //Check permissions
    if(!ctx.utils.checkPermission('all_permisisons', modulename)){
        return ctx.utils.render('basic/generic', {message: `You don't have permission to view this page.`});
    }

    let renderData = {
        verbosityEnabled: GlobalData.verbose
    }

    return ctx.utils.render('advanced', renderData);
};
