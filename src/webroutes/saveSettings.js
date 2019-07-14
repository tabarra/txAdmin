//Requires
const fs = require('fs');
const path = require('path');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const helpers = require('../extras/helpers');
const webUtils = require('./webUtils.js');
const context = 'WebServer:saveSettings';

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };

/**
 * Handle all the server control actions
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    //Sanity check
    if(isUndefined(req.params.scope)){
        res.status(400);
        return res.send({type: 'danger', message: "Invalid Request"});
    }
    let scope = req.params.scope;

    //Check permissions
    if(!webUtils.checkPermission(req, 'settings.write', context)){
        return res.send({
            type: 'danger',
            message: `You don't have permission to execute this action.`
        });
    }

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
            message: 'Unknown settings scope.'
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
    //Sanity check
    if(
        isUndefined(req.body.serverName) ||
        isUndefined(req.body.publicIP) ||
        isUndefined(req.body.verbose)
    ){
        res.status(400);
        return res.send({type: 'danger', message: "Invalid Request - missing parameters"});
    }

    //Prepare body input
    let cfg = {
        serverName: req.body.serverName.trim(),
        publicIP: req.body.publicIP.trim(),
        verbose: (req.body.verbose === 'true')
    }

    //Preparing & saving config
    let newConfig = globals.configVault.getScopedStructure('global');
    newConfig.serverName = cfg.serverName;
    newConfig.publicIP = cfg.publicIP;
    newConfig.verbose = cfg.verbose;
    let saveStatus = globals.configVault.saveProfile('global', newConfig);

    //Sending output
    if(saveStatus){
        globals.config = globals.configVault.getScoped('global');
        let logMessage = `[${req.connection.remoteAddress}][${req.session.auth.username}] Changing global settings.`;
        logOk(logMessage, context);
        globals.logger.append(logMessage);
        return res.send({type: 'success', message: `<strong>Configuration file saved!</strong>`});
    }else{
        logWarn(`[${req.connection.remoteAddress}][${req.session.auth.username}] Error changing global settings.`, context);
        return res.send({type: 'danger', message: `<strong>Error saving the configuration file.</strong>`});
    }
}


//================================================================
/**
 * Handle FXServer settings
 * @param {object} res
 * @param {object} req
 */
function handleFXServer(res, req) {
    //Sanity check
    if(
        isUndefined(req.body.buildPath) ||
        isUndefined(req.body.basePath) ||
        isUndefined(req.body.cfgPath) ||
        isUndefined(req.body.onesync) ||
        isUndefined(req.body.autostart) ||
        isUndefined(req.body.quiet)
    ){
        res.status(400);
        return res.send({type: 'danger', message: "Invalid Request - missing parameters"});
    }

    //Prepare body input
    let cfg = {
        buildPath: path.normalize(req.body.buildPath),
        basePath: path.normalize(req.body.basePath),
        cfgPath: path.normalize(req.body.cfgPath),
        onesync: (req.body.onesync === 'true'),
        autostart: (req.body.autostart === 'true'),
        quiet: (req.body.quiet === 'true'),
    }

    //Validating Build Path
    try {
        if(!fs.existsSync(cfg.buildPath)) throw new Error("Path doesn't exist or its unreadable.");
        if(globals.config.osType === 'Linux'){
            if(!fs.existsSync(`${cfg.buildPath}/run.sh`)) throw new Error("run.sh not found.");
        }else if(globals.config.osType === 'Windows_NT'){
            if(!fs.existsSync(`${cfg.buildPath}/run.cmd`)) throw new Error("run.cmd not found.");
            if(!fs.existsSync(`${cfg.buildPath}/fxserver.exe`)) throw new Error("fxserver.exe not found.");
        }else{
            throw new Error("OS Type not supported");
        }
    } catch (error) {
        return res.send({type: 'danger', message: `<strong>Build Path error:</strong> ${error.message}`});
    }

    //Validating Base Path
    try {
        if(!fs.existsSync(cfg.basePath)) throw new Error("Path doesn't exist or its unreadable.");
    } catch (error) {
        return res.send({type: 'danger', message: `<strong>Base Path error:</strong> ${error.message}`});
    }

    //Validating CFG Path
    try {
        let rawCfgFile = helpers.getCFGFile(cfg.cfgPath, cfg.basePath);
        let port = helpers.getFXServerPort(rawCfgFile);
    } catch (error) {
        return res.send({type: 'danger', message: `<strong>CFG Path error:</strong> ${error.message}`});
    }

    //Preparing & saving config
    let newConfig = globals.configVault.getScopedStructure('fxRunner');
    newConfig.buildPath = cfg.buildPath;
    newConfig.basePath = cfg.basePath;
    newConfig.cfgPath = cfg.cfgPath;
    newConfig.onesync = cfg.onesync;
    newConfig.autostart = cfg.autostart;
    newConfig.quiet = cfg.quiet;
    let saveStatus = globals.configVault.saveProfile('fxRunner', newConfig);

    //Sending output
    if(saveStatus){
        globals.fxRunner.refreshConfig();
        let logMessage = `[${req.connection.remoteAddress}][${req.session.auth.username}] Changing fxRunner settings.`;
        logOk(logMessage, context);
        globals.logger.append(logMessage);
        return res.send({type: 'success', message: `<strong>Configuration file saved!</strong>`});
    }else{
        logWarn(`[${req.connection.remoteAddress}][${req.session.auth.username}] Error changing fxRunner settings.`, context);
        return res.send({type: 'danger', message: `<strong>Error saving the configuration file.</strong>`});
    }
}


//================================================================
/**
 * Handle Monitor settings
 * @param {object} res
 * @param {object} req
 */
function handleMonitor(res, req) {
    //Sanity check
    if(
        isUndefined(req.body.timeout) ||
        isUndefined(req.body.failures) ||
        isUndefined(req.body.schedule)
    ){
        res.status(400);
        return res.send({type: 'danger', message: "Invalid Request - missing parameters"});
    }

    //Prepare body input
    let cfg = {
        timeout: parseInt(req.body.timeout),
        failures: parseInt(req.body.failures),
        schedule: req.body.schedule.split(',').map((x) => {return x.trim()})
    }

    //Validating parameters
    if(cfg.timeout > 5000) return res.send({type: 'danger', message: "The maximum timeout is 5000ms"});
    if(cfg.failures > 120) return res.send({type: 'danger', message: "The maximum failures is 120"});

    //Validating times
    let times = helpers.parseSchedule(cfg.schedule, false);
    let invalidTimes = [];
    let validTimes = [];
    times.forEach((time) => {
        if(typeof time === 'string'){
            invalidTimes.push(`"${time}"`);
        }else{
            let cleanTime = time.hour.toString().padStart(2, '0') + ':' + time.minute.toString().padStart(2, '0');
            validTimes.push(cleanTime);
        }
    });
    if(invalidTimes.length){
        let message = `<strong>The following entries were not recognized as valid 24h times:</strong><br>`;
        message += invalidTimes.join('<br>\n');
        return res.send({type: 'danger', message: message});
    }

    //Preparing & saving config
    let newConfig = globals.configVault.getScopedStructure('monitor');
    newConfig.timeout = cfg.timeout;
    newConfig.restarter.failures = cfg.failures;
    newConfig.restarter.schedule = validTimes;
    let saveStatus = globals.configVault.saveProfile('monitor', newConfig);

    //Sending output
    if(saveStatus){
        globals.monitor.refreshConfig();
        let logMessage = `[${req.connection.remoteAddress}][${req.session.auth.username}] Changing monitor settings.`;
        logOk(logMessage, context);
        globals.logger.append(logMessage);
        return res.send({type: 'success', message: `<strong>Configuration file saved!</strong>`});
    }else{
        logWarn(`[${req.connection.remoteAddress}][${req.session.auth.username}] Error changing monitor settings.`, context);
        return res.send({type: 'danger', message: `<strong>Error saving the configuration file.</strong>`});
    }
}


//================================================================
/**
 * Handle Discord settings
 * @param {object} res
 * @param {object} req
 */
function handleDiscord(res, req) {
    //Sanity check
    if(
        isUndefined(req.body.enabled) ||
        isUndefined(req.body.token) ||
        isUndefined(req.body.announceChannel) ||
        isUndefined(req.body.statusCommand)
    ){
        res.status(400);
        return res.send({type: 'danger', message: "Invalid Request - missing parameters"});
    }

    //Prepare body input
    let cfg = {
        enabled: (req.body.enabled === 'true'),
        token: req.body.token.trim(),
        announceChannel: req.body.announceChannel.trim(),
        statusCommand: req.body.statusCommand.trim()
    }

    //Preparing & saving config
    let newConfig = globals.configVault.getScopedStructure('discordBot');
    newConfig.enabled = cfg.enabled;
    newConfig.token = cfg.token;
    newConfig.announceChannel = (cfg.announceChannel.length)? cfg.announceChannel : false;
    newConfig.statusCommand = cfg.statusCommand;
    let saveStatus = globals.configVault.saveProfile('discordBot', newConfig);

    //Sending output
    if(saveStatus){
        globals.discordBot.refreshConfig();
        let logMessage = `[${req.connection.remoteAddress}][${req.session.auth.username}] Changing discordBot settings.`;
        logOk(logMessage, context);
        globals.logger.append(logMessage);
        return res.send({type: 'success', message: `<strong>Configuration file saved!</strong>`});
    }else{
        logWarn(`[${req.connection.remoteAddress}][${req.session.auth.username}] Error changing discordBot settings.`, context);
        return res.send({type: 'danger', message: `<strong>Error saving the configuration file.</strong>`});
    }
}
