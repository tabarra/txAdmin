//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../../extras/console');
const webUtils = require('./../../webUtils.js');
const context = 'WebServer:Experiments-Bans-Actions';

//Helper functions
const escape = (x) => {return x.replace(/\"/g, '\\"');};
const isUndefined = (x) => { return (typeof x === 'undefined') };
const handleError = async (res, req, error)=>{
    logError(`Database operation failed with error: ${error.message}`, context);
    if(globals.config.verbose) dir(error);
    return res.send({
        type: 'danger',
        message: `Error executing this action, please copy the error on the terminal and report in the Discord Server.`
    });
}


/**
 * Returns the output page containing the bans experiment
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    //Sanity check
    if(isUndefined(req.params.action)){
        return res.status(400).send({error: "Invalid Request"});
    }
    let action = req.params.action;


    //Check permissions
    if(!webUtils.checkPermission(req, 'all', context)){
        return res.send({
            type: 'danger',
            message: `You don't have permission to execute this action.`
        });
    }

    //Delegate to the specific action handler
    if(action === 'enable' || action === 'disable'){
        return await handleEnableDisable(res, req);
    }else if(action === 'export'){
        return await handleExport(res, req);
    }else if(action === 'unban'){
        return await handleUnban(res, req);
    }else if(action === 'ban'){
        return await handleBan(res, req);
    }else{
        return res.send({
            type: 'danger',
            message: 'Unknown action.'
        });
    }
};


//================================================================
/**
 * Handle EnableDisable
 * @param {object} res
 * @param {object} req
 */
async function handleEnableDisable(res, req) {
    try {
        let desiredStatus = (req.params.action === 'enable');
        let dbo = globals.database.getDB();
        await dbo.set("experiments.bans.enabled", desiredStatus).write();
    } catch (error) {
        return await handleError(res, req, error);
    }

    return res.redirect('/experiments/bans');
}


//================================================================
/**
 * Handle Export
 * @param {object} res
 * @param {object} req
 */
async function handleExport(res, req) {
    try {
        let dbo = globals.database.getDB();
        let banList = await dbo.get("experiments.bans.banList").value();
        return res.set('Content-Type', 'text/plain').send(JSON.stringify(banList,null,2));
    } catch (error) {
        return await handleError(res, req, error);
    }
}


//================================================================
/**
 * Handle Unban
 * @param {object} res
 * @param {object} req
 */
async function handleUnban(res, req) {
    //Checking request
    if(isUndefined(req.body.identifier)){
        return res.send({type: 'danger', message: 'Invalid request.'});
    }
    let identifier = req.body.identifier.trim().toLowerCase();

    try {
        let dbo = globals.database.getDB();
        await dbo.get("experiments.bans.banList")
                .remove(function(b) { return b.identifier == identifier; })
                .write();
        log(`[${req.connection.remoteAddress}][${req.session.auth.username}] Unbanned identifier '${identifier}'.`);
    } catch (error) {
        return await handleError(res, req, error);
    }

    return res.send({refresh:true});
}


//================================================================
/**
 * Handle Ban
 * @param {object} res
 * @param {object} req
 */
async function handleBan(res, req) {
    //Checking request
    if(
        isUndefined(req.body.identifier) ||
        isUndefined(req.body.reason)
    ){
        return res.send({type: 'danger', message: 'Invalid request.'});
    }
    let identifier = req.body.identifier.trim().toLowerCase();
    let reason = req.body.reason.trim();

    //Validating ban
    let availableIdentifiers = ['steam', 'license', 'xbl', 'live', 'discord'];
    let isValidIdentifier = availableIdentifiers.some((idType)=>{
        let header = `${idType}:`;
        return (identifier.startsWith(header) && identifier.length > header.length);
    })
    if(!isValidIdentifier){
        return res.send({type: 'danger', message: 'Invalid identifier. Please use the formar "type:id" (example: steam:101010101010101)'});
    }

    //Kicking player
    let cmd = `txaKickIdentifier "${escape(identifier)}" "${escape(reason)}"`
    await globals.fxRunner.srvCmdBuffer(cmd);

    let banData = {
        timestamp: (Date.now() / 1000).toFixed(),
        banned_by: req.session.auth.username,
        identifier,
        reason
    }
    try {
        let dbo = globals.database.getDB();
        await dbo.get("experiments.bans.banList")
                .push(banData)
                .write();
        log(`[${req.connection.remoteAddress}][${req.session.auth.username}] Banned identifier '${identifier}'.`);
    } catch (error) {
        return await handleError(res, req, error);
    }

    return res.send({refresh:true});
}
