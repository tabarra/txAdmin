//Requires
const modulename = 'WebServer:AddExtension';
const { dir, log, logOk, logWarn, logError} = require('../extras/console')(modulename);


/**
 * Returns the Add Extension page
 * @param {object} ctx
 */
module.exports = async function AddExtension(ctx) {
    //Rendering the page
    return ctx.utils.render('addExtension', {});
};
