//Requires
const modulename = 'WebServer:DownFXServerLog';
const { dir, log, logOk, logWarn, logError} = require('../extras/console')(modulename);


/**
 * Returns the console log file
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    //Check permissions
    if(!webUtils.checkPermission(req, 'console.view', modulename)){
        let out = await webUtils.renderMasterView('basic/generic', req.session, {message: `You don't have permission to download this log.`});
        return res.send(out);
    }

    let now = (new Date()/1000).toFixed();
    log(`[${req.connection.remoteAddress}][${req.session.auth.username}] Downloading console log file.`);
    return res.download(globals.fxRunner.config.logPath, `fxserver_${now}.log`);
};
