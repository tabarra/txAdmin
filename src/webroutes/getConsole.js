//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const webUtils = require('./webUtils.js');
const context = 'WebServer:getConsole';


/**
 * Returns the output page containing the live console
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    //Check permissions
    if(!webUtils.checkPermission(req, 'console.view', context)){
        let out = await webUtils.renderMasterView('generic', {message: `You don't have permission to view this page.`});
        return res.send(out);
    }

    let renderData = {
        headerTitle: 'Console',
        disableWrite: (webUtils.checkPermission(req, 'console.write'))? 'autofocus' : 'disabled'
    }

    let out = await webUtils.renderMasterView('console', renderData);
    return res.send(out);
};
