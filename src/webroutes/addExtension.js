//Requires
const modulename = 'WebServer:AddExtension';
const { dir, log, logOk, logWarn, logError} = require('../extras/console')(modulename);


/**
 * Returns the Add Extension page
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    //Rendering the page
    let out = await webUtils.renderMasterView('addExtension', req.session);
    return res.send(out);
};
