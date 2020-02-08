//Requires
const modulename = 'WebServer:Intercom';
const { dir, log, logOk, logWarn, logError} = require('../extras/console')(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };

/**
 * Intercommunications endpoint
 * @param {object} res
 * @param {object} req
 */
//FIXME: tmp function
module.exports = async function Intercom(ctx) {
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
        if(!Array.isArray(req.body.resources)){
            return res.status(400).send({error: "Invalid Request"});
        }
        globals.intercomTempResList = {
            timestamp: new Date(),
            data: req.body.resources
        }

    }else if(scope == 'logger'){
        if(!Array.isArray(req.body.log)){
            return res.status(400).send({error: "Invalid Request"});
        }
        globals.intercomTempLog = globals.intercomTempLog.concat(req.body.log)

    }else if(scope == 'checkWhitelist'){
        //FIXME: temporarily disabled
        return res.status(403).send({error: "Feature temporariyl disabled."});

        if(!Array.isArray(req.body.identifiers)){
            return res.status(400).send({error: "Invalid Request"});
        }
        try {
            let dbo = globals.database.getDB();
            let usr = await dbo.get("experiments.bans.banList")
                    .find(function(o) { return req.body.identifiers.includes(o.identifier); })
                    .value()
            let resp = (typeof usr === 'undefined')? 'whitelist-ok' : 'whitelist-block';
            return res.send(resp);
        } catch (error) {
            logError(`[whitelistCheck] Database operation failed with error: ${error.message}`);
            if(globals.config.verbose) dir(error);
            return res.send('whitelist-error');
        }

    }else{
        return res.send({
            type: 'danger',
            message: 'Unknown intercom scope.'
        });
    }

    return res.send({success: true});
};
