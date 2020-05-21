//Requires
const modulename = 'WebServer:ExperimentsBansActions';
const { dir, log, logOk, logWarn, logError } = require('../../../extras/console')(modulename);

//Helper functions
const escape = (x) => {return x.replace(/\"/g, '\\"');};
const isUndefined = (x) => { return (typeof x === 'undefined') };
const handleError = (ctx, error)=>{
    logError(`Database operation failed with error: ${error.message}`);
    if(GlobalData.verbose) dir(error);
    return ctx.send({
        type: 'danger',
        message: `Error executing this action, please copy the error on the terminal and report in the Discord Server.`
    });
}


/**
 * Returns the output page containing the bans experiment
 * @param {object} ctx
 */
module.exports = async function ExperimentsBansActions(ctx) {
    //FIXME: temporarily disabled
    return ctx.utils.error(403, 'Feature temporarily disabled.');

    //Sanity check
    if(isUndefined(ctx.params.action)){
        return ctx.utils.error(400, 'Invalid Request');
    }
    let action = ctx.params.action;


    //Check permissions
    if(!ctx.utils.checkPermission('all_permissions', modulename)){
        return ctx.send({
            type: 'danger',
            message: `You don't have permission to execute this action.`
        });
    }

    //Delegate to the specific action handler
    if(action === 'enable' || action === 'disable'){
        return await handleEnableDisable(ctx);
    }else if(action === 'export'){
        return await handleExport(ctx);
    }else if(action === 'unban'){
        return await handleUnban(ctx);
    }else if(action === 'ban'){
        return await handleBan(ctx);
    }else{
        return ctx.send({
            type: 'danger',
            message: 'Unknown action.'
        });
    }
};


//================================================================
/**
 * Handle EnableDisable
 * @param {object} ctx
 */
async function handleEnableDisable(ctx) {
    try {
        let desiredStatus = (ctx.params.action === 'enable');
        let dbo = globals.database.getDB();
        await dbo.set("experiments.bans.enabled", desiredStatus).write();
    } catch (error) {
        return handleError(ctx, error);
    }

    return ctx.response.redirect('/experiments/bans');
}


//================================================================
/**
 * Handle Export
 * @param {object} ctx
 */
async function handleExport(ctx) {
    try {
        let dbo = globals.database.getDB();
        let banList = await dbo.get("experiments.bans.banList").value();
        let now = (new Date()/1000).toFixed();
        ctx.attachment(`bans_${now}.json`)
        ctx.body = banList;
        return;
    } catch (error) {
        return handleError(ctx, error);
    }
}


//================================================================
/**
 * Handle Unban
 * @param {object} ctx
 */
async function handleUnban(ctx) {
    //Checking request
    if(isUndefined(ctx.request.body.identifier)){
        return ctx.send({type: 'danger', message: 'Invalid request.'});
    }
    let identifier = ctx.request.body.identifier.trim().toLowerCase();

    try {
        let dbo = globals.database.getDB();
        await dbo.get("experiments.bans.banList")
                .remove(function(b) { return b.identifier == identifier; })
                .write();
        log(`[${ctx.ip}][${ctx.session.auth.username}] Unbanned identifier '${identifier}'.`);
    } catch (error) {
        return handleError(ctx, error);
    }

    return ctx.send({refresh:true});
}


//================================================================
/**
 * Handle Ban
 * @param {object} ctx
 */
async function handleBan(ctx) {
    //Checking request
    if(
        isUndefined(ctx.request.body.identifier) ||
        isUndefined(ctx.request.body.reason)
    ){
        return ctx.send({type: 'danger', message: 'Invalid request.'});
    }
    let identifier = ctx.request.body.identifier.trim().toLowerCase();
    let reason = ctx.request.body.reason.trim();

    //Validating ban
    let availableIdentifiers = ['steam', 'license', 'xbl', 'live', 'discord'];
    let isValidIdentifier = availableIdentifiers.some((idType)=>{
        let header = `${idType}:`;
        return (identifier.startsWith(header) && identifier.length > header.length);
    })
    if(!isValidIdentifier){
        return ctx.send({type: 'danger', message: 'Invalid identifier. Please use the formar "type:id" (example: steam:101010101010101)'});
    }

    //Kicking player
    let cmd = `txaDropIdentifier "${escape(identifier)}" "${escape(reason)}"`
    await globals.fxRunner.srvCmdBuffer(cmd);

    let banData = {
        timestamp: (Date.now() / 1000).toFixed(),
        banned_by: ctx.session.auth.username,
        identifier,
        reason
    }
    try {
        let dbo = globals.database.getDB();
        await dbo.get("experiments.bans.banList")
                .push(banData)
                .write();
        log(`[${ctx.ip}][${ctx.session.auth.username}] Banned identifier '${identifier}'.`);
    } catch (error) {
        return handleError(ctx, error);
    }

    return ctx.send({refresh:true});
}
