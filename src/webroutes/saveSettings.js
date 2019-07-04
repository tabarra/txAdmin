//Requires
const sleep = require('util').promisify(setTimeout);
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const webUtils = require('./webUtils.js');
const context = 'WebServer:saveSettings';


/**
 * Handle all the server control actions
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    //Sanity check
    if(typeof req.params.scope === 'undefined'){
        res.status(400);
        res.send({status: 'error', error: "Invalid Request"});
        return;
    }
    let scope = req.params.scope;

    dir(req.body)
    //Delegate to the specific scope functions
    if(scope == 'global'){
        return handleGlobal(res, req);
    }else if(scope == 'fxserver'){
        return handleFXServer(res, req);
    }else if(scope == 'monitor'){
        return handleMonitor(res, req);
    }else if(scope == 'discord'){
        return handleDiscord(res, req);
    }else{
        return res.send({
            type: 'danger',
            message: 'Settings scope not found.'
        });
    }
};


//================================================================
/**
 * Handle Global settings
 * @param {object} res 
 * @param {object} req 
 */
function handleGlobal(res, req) {
    return res.send({
        type: 'info',
        message: 'lalalalahandleGlobal'
    });
}


//================================================================
/**
 * Handle FXServer settings
 * @param {object} res 
 * @param {object} req 
 */
function handleFXServer(res, req) {
    return res.send({
        type: 'info',
        message: 'lalalalahandleFXServer'
    });
}


//================================================================
/**
 * Handle Monitor settings
 * @param {object} res 
 * @param {object} req 
 */
function handleMonitor(res, req) {
    return res.send({
        type: 'info',
        message: 'lalalalahandleMonitor'
    });
}


//================================================================
/**
 * Handle Discord settings
 * @param {object} res 
 * @param {object} req 
 */
function handleDiscord(res, req) {
    return res.send({
        type: 'info',
        message: 'lalalalaDiscord'
    });
}
