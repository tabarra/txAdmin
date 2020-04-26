//Requires
const modulename = 'WebServer:Intercom';
const clone = require('clone');
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };

/**
 * Intercommunications endpoint
 * @param {object} ctx
 */
//FIXME: tmp function
module.exports = async function Intercom(ctx) {
    //Sanity check
    if(isUndefined(ctx.params.scope)){
        return ctx.utils.error(400, 'Invalid Request');
    }
    let scope = ctx.params.scope;

    let postData = clone(ctx.request.body);
    postData.txAdminToken = true;

    //Delegate to the specific scope functions
    if(scope == 'monitor'){
        try {
            // dir(postData)
            globals.monitor.handleHeartBeat(postData);
        } catch (error) {}

    }else if(scope == 'resources'){
        if(!Array.isArray(postData.resources)){
            return ctx.utils.error(400, 'Invalid Request');
        }
        globals.databus.resourcesList = {
            timestamp: new Date(),
            data: postData.resources
        }

    }else if(scope == 'logger'){
        if(!Array.isArray(postData.log)){
            return ctx.utils.error(400, 'Invalid Request');
        }
        globals.databus.serverLog = globals.databus.serverLog.concat(postData.log)

    }else if(scope == 'checkWhitelist'){
        //FIXME: temporarily disabled
        return ctx.utils.error(403, 'Feature temporarily disabled.');

        if(!Array.isArray(postData.identifiers)){
            return ctx.utils.error(400, 'Invalid Request');
        }
        try {
            let dbo = globals.database.getDB();
            let usr = await dbo.get("experiments.bans.banList")
                    .find(function(o) { return postData.identifiers.includes(o.identifier); })
                    .value()
            let resp = (typeof usr === 'undefined')? 'whitelist-ok' : 'whitelist-block';
            return ctx.send(resp);
        } catch (error) {
            logError(`[whitelistCheck] Database operation failed with error: ${error.message}`);
            if(GlobalData.verbose) dir(error);
            return ctx.send('whitelist-error');
        }

    }else{
        return ctx.send({
            type: 'danger',
            message: 'Unknown intercom scope.'
        });
    }

    return ctx.send({success: true});
};
