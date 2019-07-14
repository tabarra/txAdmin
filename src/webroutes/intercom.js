//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const webUtils = require('./webUtils.js');
const context = 'WebServer:Intercom';


/**
 * Intercommunications endpoint
 * @param {object} res
 * @param {object} req
 */
//FIXME: tmp function
module.exports = async function action(res, req) {
    if(
        typeof req.params.scope === 'undefined' ||
        req.params.scope !== 'monitor'
    ){
        res.status(400);
        return res.send({error: "Invalid Request"});
    }
    // dir(req.params)
    // dir(req.body)
    try {
        globals.monitor.handleHeartBeat(req.body);
    } catch (error) {}

    return res.send('okay');
};
