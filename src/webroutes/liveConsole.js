//Requires
const modulename = 'WebServer:LiveConsole';
const { dir, log, logOk, logWarn, logError} = require('../extras/console')(modulename);


/**
 * Returns the output page containing the live console
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    //Check permissions
    if(!webUtils.checkPermission(req, 'console.view', modulename)){
        let out = await webUtils.renderMasterView('basic/generic', req.session, {message: `You don't have permission to view this page.`});
        return res.send(out);
    }

    let renderData = {
        headerTitle: 'Console',
        disableWrite: (webUtils.checkPermission(req, 'console.write', modulename))? 'autofocus' : 'disabled'
    }

    let out = await webUtils.renderMasterView('console', req.session, renderData);
    return res.send(out);
};
