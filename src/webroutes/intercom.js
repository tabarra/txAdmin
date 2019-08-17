//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const webUtils = require('./webUtils.js');
const context = 'WebServer:Intercom';

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };

/**
 * Intercommunications endpoint
 * @param {object} res
 * @param {object} req
 */
//FIXME: tmp function
module.exports = async function action(res, req) {
    //Sanity check
    if(isUndefined(req.params.scope)){
        return res.status(400).send({error: "Invalid Request"});
    }
    let scope = req.params.scope;

    //Delegate to the specific scope functions
    if(scope == 'monitor'){
        try {
            globals.monitor.handleHeartBeat(req.body);
        } catch (error) {}
    }else if(scope == 'resources'){
        globals.intercomTempList = {
            timestamp: new Date(),
            data: req.body.resources
        }
    }else{
        return res.send({
            type: 'danger',
            message: 'Unknown intercom scope.'
        });
    }

    return res.send('okay');
};
