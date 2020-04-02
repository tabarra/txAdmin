//Requires
const modulename = 'WebServer:Intercom';
const { dir, log, logOk, logWarn, logError} = require('../extras/console')(modulename);

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

    //Delegate to the specific scope functions
    if(scope == 'monitor'){
        try {
            globals.monitor.handleHeartBeat(ctx.request.body);
        } catch (error) {}

    }else if(scope == 'resources'){
        if(!Array.isArray(ctx.request.body.resources)){
            return ctx.utils.error(400, 'Invalid Request');
        }
        globals.intercomTempResList = {
            timestamp: new Date(),
            data: ctx.request.body.resources
        }

    }else if(scope == 'logger'){
        if(!Array.isArray(ctx.request.body.log)){
            return ctx.utils.error(400, 'Invalid Request');
        }
        globals.intercomTempLog = globals.intercomTempLog.concat(ctx.request.body.log)

    }else if(scope == 'checkWhitelist'){
        //FIXME: temporarily disabled
        return ctx.utils.error(403, 'Feature temporarily disabled.');

        if(!Array.isArray(ctx.request.body.identifiers)){
            return ctx.utils.error(400, 'Invalid Request');
        }
        try {
            let dbo = globals.database.getDB();
            let usr = await dbo.get("experiments.bans.banList")
                    .find(function(o) { return ctx.request.body.identifiers.includes(o.identifier); })
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
