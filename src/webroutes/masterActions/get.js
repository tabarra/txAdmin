//Requires
const modulename = 'WebServer:MasterActions:Get';
const path = require('path');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const helpers = require('../../extras/helpers');

//Helpers
const isUndefined = (x) => { return (typeof x === 'undefined') };


/**
 * Returns the output page containing the server.cfg
 * @param {object} ctx
 */
module.exports = async function MasterActionsGet(ctx) {
    //Sanity check
    if(isUndefined(ctx.params.page)){
        return ctx.utils.error(400, 'Invalid Request');
    }
    const page = ctx.params.page;

    //Check permissions
    if(!ctx.utils.checkPermission('master', modulename)){
        return ctx.utils.render('basic/generic', {message: `Only the master account has permission to view/use this page.`});
    }

    //Render the page
    if(page == 'importBans'){
        return ctx.utils.render('masterActions/importBans', {
            dbFilePathSuggestion: path.join(globals.fxRunner.config.serverDataPath, 'resources')
        });
    }else{
        return ctx.utils.render('basic/404');
    }
};
