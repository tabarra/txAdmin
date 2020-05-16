//Requires
const modulename = 'WebServer:PlayerList';
const dateFormat = require('dateformat');
const xss = require('../../extras/xss')();
const { dir, log, logOk, logWarn, logError, getLog } = require('../../extras/console')(modulename);


/**
 * Returns the output page containing the action log, and the console log
 * @param {object} ctx
 */
module.exports = async function PlayerList(ctx) {
    //Check permissions HACK
    // if(!ctx.utils.checkPermission('xxxxx', modulename)){
    //     return ctx.utils.render('basic/generic', {message: `You don't have permission to view this page.`});
    // }
    
    //Output
    return ctx.utils.render('playerList', {headerTitle: 'Players'});
};
