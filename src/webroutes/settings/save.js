//Requires
const modulename = 'WebServer:SettingsSave';
const fs = require('fs');
const slash = require('slash');
const path = require('path');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const helpers = require('../../extras/helpers');

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };

/**
 * Handle all the server control actions
 * @param {object} ctx
 */
module.exports = async function SettingsSave(ctx) {
    //Sanity check
    if(isUndefined(ctx.params.scope)){
        return ctx.utils.error(400, 'Invalid Request');
    }
    let scope = ctx.params.scope;

    //Check permissions
    if(!ctx.utils.checkPermission('settings.write', modulename)){
        return ctx.send({
            type: 'danger',
            message: `You don't have permission to execute this action.`
        });
    }

    //Delegate to the specific scope functions
    if(scope == 'global'){
        return handleGlobal(ctx);
    }else if(scope == 'fxserver'){
        return handleFXServer(ctx);
    }else if(scope == 'monitor'){
        return handleMonitor(ctx);
    }else if(scope == 'discord'){
        return handleDiscord(ctx);
    }else{
        return ctx.send({
            type: 'danger',
            message: 'Unknown settings scope.'
        });
    }
};


//================================================================
/**
 * Handle Global settings
 * @param {object} ctx
 */
function handleGlobal(ctx) {
    //Sanity check
    if(
        isUndefined(ctx.request.body.serverName) ||
        isUndefined(ctx.request.body.language) ||
        isUndefined(ctx.request.body.verbose)
    ){
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    //Prepare body input
    let cfg = {
        serverName: ctx.request.body.serverName.trim(),
        language: ctx.request.body.language.trim(),
        verbose: (ctx.request.body.verbose === 'true')
    }

    //Trying to load language file
    let langPhrases;
    try {
        langPhrases = globals.translator.getLanguagePhrases(cfg.language);
    } catch (error) {
        return ctx.send({type: 'danger', message: `<strong>Language error:</strong> ${error.message}`});
    }

    //Preparing & saving config
    let newConfig = globals.configVault.getScopedStructure('global');
    newConfig.serverName = cfg.serverName;
    newConfig.language = cfg.language;
    let saveStatus = globals.configVault.saveProfile('global', newConfig);

    //Sending output
    if(saveStatus){
        globals.translator.refreshConfig(langPhrases);
        globals.config = globals.configVault.getScoped('global');
        let logMessage = `[${ctx.ip}][${ctx.session.auth.username}] Changing global settings.`;
        logOk(logMessage);
        globals.logger.append(logMessage);
        return ctx.send({type: 'success', message: `<strong>Global configuration saved!</strong>`});
    }else{
        logWarn(`[${ctx.ip}][${ctx.session.auth.username}] Error changing global settings.`);
        return ctx.send({type: 'danger', message: `<strong>Error saving the configuration file.</strong>`});
    }
}


//================================================================
/**
 * Handle FXServer settings
 * @param {object} ctx
 */
function handleFXServer(ctx) {
    //Sanity check
    if(
        isUndefined(ctx.request.body.serverDataPath) ||
        isUndefined(ctx.request.body.cfgPath) ||
        isUndefined(ctx.request.body.commandLine) ||
        isUndefined(ctx.request.body.onesync) ||
        isUndefined(ctx.request.body.autostart) ||
        isUndefined(ctx.request.body.quiet)
    ){
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    //Prepare body input
    let cfg = {
        serverDataPath: slash(path.normalize(ctx.request.body.serverDataPath+'/')),
        cfgPath: slash(path.normalize(ctx.request.body.cfgPath)),
        commandLine: ctx.request.body.commandLine,
        onesync: (ctx.request.body.onesync === 'true'),
        autostart: (ctx.request.body.autostart === 'true'),
        quiet: (ctx.request.body.quiet === 'true'),
    }

    //Validating path spaces
    if(
        cfg.serverDataPath.includes(' ') ||
        cfg.cfgPath.includes(' ')
    ){
        return ctx.send({type: 'danger', message: `The paths cannot contain spaces.`});
    }

    //Validating Base Path
    try {
        if(!fs.existsSync(path.join(cfg.serverDataPath, 'resources'))){
            if(cfg.serverDataPath.includes('resources')){
                throw new Error("The base must be the folder that contains the resources folder.");
            }else{
                throw new Error("Couldn't locate or read a resources folder inside of the base path.");
            }
        }
    } catch (error) {
        return ctx.send({type: 'danger', message: `<strong>Server Data Folder error:</strong> ${error.message}`});
    }

    //Validating CFG Path
    try {
        let cfgFilePath = helpers.resolveCFGFilePath(cfg.cfgPath, cfg.serverDataPath);
        let rawCfgFile = helpers.getCFGFileData(cfgFilePath);
        let port = helpers.getFXServerPort(rawCfgFile);
    } catch (error) {
        return ctx.send({type: 'danger', message: `<strong>CFG Path error:</strong> ${error.message}`});
    }

    //Preparing & saving config
    let newConfig = globals.configVault.getScopedStructure('fxRunner');
    newConfig.serverDataPath = cfg.serverDataPath;
    newConfig.cfgPath = cfg.cfgPath;
    newConfig.onesync = cfg.onesync;
    newConfig.autostart = cfg.autostart;
    newConfig.quiet = cfg.quiet;
    newConfig.commandLine = cfg.commandLine;
    let saveStatus = globals.configVault.saveProfile('fxRunner', newConfig);

    //Sending output
    if(saveStatus){
        globals.fxRunner.refreshConfig();
        let logMessage = `[${ctx.ip}][${ctx.session.auth.username}] Changing fxRunner settings.`;
        logOk(logMessage);
        globals.logger.append(logMessage);
        return ctx.send({type: 'success', message: `<strong>FXServer configuration saved!</strong>`});
    }else{
        logWarn(`[${ctx.ip}][${ctx.session.auth.username}] Error changing fxRunner settings.`);
        return ctx.send({type: 'danger', message: `<strong>Error saving the configuration file.</strong>`});
    }
}


//================================================================
/**
 * Handle Monitor settings
 * @param {object} ctx
 */
function handleMonitor(ctx) {
    //Sanity check
    if(
        isUndefined(ctx.request.body.schedule)
    ){
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    //Prepare body input
    let cfg = {
        schedule: ctx.request.body.schedule.split(',').map((x) => {return x.trim()})
    }

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
        return ctx.send({type: 'danger', message: message});
    }

    //Preparing & saving config
    let newConfig = globals.configVault.getScopedStructure('monitor');
    newConfig.restarterSchedule = validTimes;
    let saveStatus = globals.configVault.saveProfile('monitor', newConfig);

    //Sending output
    if(saveStatus){
        globals.monitor.refreshConfig();
        let logMessage = `[${ctx.ip}][${ctx.session.auth.username}] Changing monitor settings.`;
        logOk(logMessage);
        globals.logger.append(logMessage);
        return ctx.send({type: 'success', message: `<strong>Monitor/Restarter configuration saved!</strong>`});
    }else{
        logWarn(`[${ctx.ip}][${ctx.session.auth.username}] Error changing monitor settings.`);
        return ctx.send({type: 'danger', message: `<strong>Error saving the configuration file.</strong>`});
    }
}


//================================================================
/**
 * Handle Discord settings
 * @param {object} ctx
 */
function handleDiscord(ctx) {
    //Sanity check
    if(
        isUndefined(ctx.request.body.enabled) ||
        isUndefined(ctx.request.body.token) ||
        isUndefined(ctx.request.body.announceChannel) ||
        isUndefined(ctx.request.body.statusCommand) ||
        isUndefined(ctx.request.body.statusMessage)
    ){
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    //Prepare body input
    let cfg = {
        enabled: (ctx.request.body.enabled === 'true'),
        token: ctx.request.body.token.trim(),
        announceChannel: ctx.request.body.announceChannel.trim(),
        statusCommand: ctx.request.body.statusCommand.trim(),
        statusMessage: ctx.request.body.statusMessage.trim(),
    }

    //Preparing & saving config
    let newConfig = globals.configVault.getScopedStructure('discordBot');
    newConfig.enabled = cfg.enabled;
    newConfig.token = cfg.token;
    newConfig.announceChannel = (cfg.announceChannel.length)? cfg.announceChannel : false;
    newConfig.statusCommand = cfg.statusCommand;
    newConfig.statusMessage = cfg.statusMessage;
    let saveStatus = globals.configVault.saveProfile('discordBot', newConfig);

    //Sending output
    if(saveStatus){
        globals.discordBot.refreshConfig();
        let logMessage = `[${ctx.ip}][${ctx.session.auth.username}] Changing discordBot settings.`;
        logOk(logMessage);
        globals.logger.append(logMessage);
        if(newConfig.enabled){
            return ctx.send({type: 'warning', message: `<strong>Discord configuration saved. Check terminal to make sure the token is valid.</strong>`});
        }else{
            return ctx.send({type: 'success', message: `<strong>Discord configuration saved!</strong>`});
        }
    }else{
        logWarn(`[${ctx.ip}][${ctx.session.auth.username}] Error changing discordBot settings.`);
        return ctx.send({type: 'danger', message: `<strong>Error saving the configuration file.</strong>`});
    }
}
