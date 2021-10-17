//Requires
const modulename = 'WebServer:SettingsSave';
const fs = require('fs');
const slash = require('slash');
const path = require('path');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const helpers = require('../../extras/helpers');

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined'); };
const anyUndefined = (...args) => { return [...args].some((x) => (typeof x === 'undefined')); };

/**
 * Handle all the server control actions
 * @param {object} ctx
 */
module.exports = async function SettingsSave(ctx) {
    //Sanity check
    if (isUndefined(ctx.params.scope)) {
        return ctx.utils.error(400, 'Invalid Request');
    }
    let scope = ctx.params.scope;

    //Check permissions
    if (!ctx.utils.checkPermission('settings.write', modulename)) {
        return ctx.send({
            type: 'danger',
            message: 'You don\'t have permission to execute this action.',
        });
    }

    //Delegate to the specific scope functions
    if (scope == 'global') {
        return handleGlobal(ctx);
    } else if (scope == 'fxserver') {
        return handleFXServer(ctx);
    } else if (scope == 'playerController') {
        return handlePlayerController(ctx);
    } else if (scope == 'monitor') {
        return handleMonitor(ctx);
    } else if (scope == 'discord') {
        return handleDiscord(ctx);
    } else {
        return ctx.send({
            type: 'danger',
            message: 'Unknown settings scope.',
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
    if (
        isUndefined(ctx.request.body.serverName)
        || isUndefined(ctx.request.body.language)
        || isUndefined(ctx.request.body.verbose)
    ) {
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    //Prepare body input
    let cfg = {
        serverName: ctx.request.body.serverName.trim(),
        language: ctx.request.body.language.trim(),
        verbose: (ctx.request.body.verbose === 'true'),
    };

    //Trying to load language file
    try {
        globals.translator.getLanguagePhrases(cfg.language);
    } catch (error) {
        return ctx.send({type: 'danger', message: `<strong>Language error:</strong> ${error.message}`});
    }

    //Preparing & saving config
    let newConfig = globals.configVault.getScopedStructure('global');
    newConfig.serverName = cfg.serverName;
    newConfig.language = cfg.language;
    let saveStatus = globals.configVault.saveProfile('global', newConfig);

    //Sending output
    if (saveStatus) {
        globals.config = globals.configVault.getScoped('global');
        globals.translator.refreshConfig();
        ctx.utils.logAction('Changing global settings.');
        return ctx.send({type: 'success', message: '<strong>Global configuration saved!</strong>'});
    } else {
        logWarn(`[${ctx.session.auth.username}] Error changing global settings.`);
        return ctx.send({type: 'danger', message: '<strong>Error saving the configuration file.</strong>'});
    }
}


//================================================================
/**
 * Handle FXServer settings
 * TODO: it MAY be worth to use helpers.findLikelyServerDataPath() and helpers.findLikelyCFGPath()
 * @param {object} ctx
 */
function handleFXServer(ctx) {
    //Sanity check
    if (
        isUndefined(ctx.request.body.serverDataPath)
        || isUndefined(ctx.request.body.cfgPath)
        || isUndefined(ctx.request.body.commandLine)
        || isUndefined(ctx.request.body.onesync)
        || isUndefined(ctx.request.body.autostart)
        || isUndefined(ctx.request.body.quiet)
    ) {
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    //Prepare body input
    let cfg = {
        serverDataPath: slash(path.normalize(ctx.request.body.serverDataPath + '/')),
        cfgPath: slash(path.normalize(ctx.request.body.cfgPath)),
        commandLine: ctx.request.body.commandLine.trim(),
        onesync: ctx.request.body.onesync,
        autostart: (ctx.request.body.autostart === 'true'),
        quiet: (ctx.request.body.quiet === 'true'),
    };

    //Validating Base Path
    try {
        if (!fs.existsSync(path.join(cfg.serverDataPath, 'resources'))) {
            if (cfg.serverDataPath.includes('resources')) {
                throw new Error('The base must be the folder that contains the resources folder.');
            } else {
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
        let _port = helpers.getFXServerPort(rawCfgFile);
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
    if (saveStatus) {
        globals.fxRunner.refreshConfig();
        ctx.utils.logAction('Changing fxRunner settings.');
        return ctx.send({type: 'success', message: '<strong>FXServer configuration saved!</strong>'});
    } else {
        logWarn(`[${ctx.session.auth.username}] Error changing fxRunner settings.`);
        return ctx.send({type: 'danger', message: '<strong>Error saving the configuration file.</strong>'});
    }
}


//================================================================
/**
 * Handle Player Controller settings
 * @param {object} ctx
 */
function handlePlayerController(ctx) {
    //Sanity check
    if (anyUndefined(
        ctx.request.body,
        ctx.request.body.onJoinCheckBan,
        ctx.request.body.onJoinCheckWhitelist,
        ctx.request.body.minSessionTime,
        ctx.request.body.whitelistRejectionMessage,
        ctx.request.body.wipePendingWLOnStart,
    )) {
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    //Prepare body input
    let cfg = {
        onJoinCheckBan: (ctx.request.body.onJoinCheckBan === 'true'),
        onJoinCheckWhitelist: (ctx.request.body.onJoinCheckWhitelist === 'true'),
        minSessionTime: parseInt(ctx.request.body.minSessionTime.trim()),
        whitelistRejectionMessage: ctx.request.body.whitelistRejectionMessage.trim(),
        wipePendingWLOnStart: (ctx.request.body.wipePendingWLOnStart === 'true'),
    };

    //Validating wl message
    if (cfg.whitelistRejectionMessage.length > 256) {
        return ctx.send({type: 'danger', message: 'The whitelist rejection message must be less than 256 characters.'});
    }

    //Validating min session time
    if (cfg.minSessionTime < 1 || cfg.minSessionTime > 60) {
        return ctx.send({type: 'danger', message: 'Minimum Session Time must be between 1 and 60 minutes.'});
    }

    //Preparing & saving config
    let newConfig = globals.configVault.getScopedStructure('playerController');
    newConfig.onJoinCheckBan = cfg.onJoinCheckBan;
    newConfig.onJoinCheckWhitelist = cfg.onJoinCheckWhitelist;
    newConfig.minSessionTime = cfg.minSessionTime;
    newConfig.whitelistRejectionMessage = cfg.whitelistRejectionMessage;
    newConfig.wipePendingWLOnStart = cfg.wipePendingWLOnStart;
    let saveStatus = globals.configVault.saveProfile('playerController', newConfig);

    //Sending output
    if (saveStatus) {
        globals.playerController.refreshConfig();
        ctx.utils.logAction('Changing Player Controller settings.');
        return ctx.send({type: 'success', message: '<strong>Player Controller configuration saved!</strong>'});
    } else {
        logWarn(`[${ctx.session.auth.username}] Error changing Player Controller settings.`);
        return ctx.send({type: 'danger', message: '<strong>Error saving the configuration file.</strong>'});
    }
}


//================================================================
/**
 * Handle Monitor settings
 * @param {object} ctx
 */
function handleMonitor(ctx) {
    //Sanity check
    if (
        isUndefined(ctx.request.body.restarterSchedule),
        isUndefined(ctx.request.body.disableChatWarnings),
        isUndefined(ctx.request.body.restarterScheduleWarnings)
    ) {
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    //Prepare body input
    let cfg = {
        restarterSchedule: ctx.request.body.restarterSchedule.split(',').map((x) => {return x.trim();}),
        restarterScheduleWarnings: ctx.request.body.restarterScheduleWarnings.split(',').map((x) => {return x.trim();}),
        disableChatWarnings: (ctx.request.body.disableChatWarnings === 'true'),
    };

    //Validating restart times
    let scheduleTimes = helpers.parseSchedule(cfg.restarterSchedule, false);
    let invalidRestartTimes = [];
    let validRestartTimes = [];
    scheduleTimes.forEach((time) => {
        if (typeof time === 'string') {
            invalidRestartTimes.push(`"${time}"`);
        } else {
            const cleanTime = time.hour.toString().padStart(2, '0') + ':' + time.minute.toString().padStart(2, '0');
            validRestartTimes.push(cleanTime);
        }
    });
    if (invalidRestartTimes.length) {
        let message = '<strong>The following entries were not recognized as valid 24h times:</strong><br>';
        message += invalidRestartTimes.join('<br>\n');
        return ctx.send({type: 'danger', message: message});
    }

    //Validating restart warning minutes
    const invalidRestartWarningMinutes = [];
    const validRestartWarningMinutes = [];
    cfg.restarterScheduleWarnings.forEach((minutes) => {
        if (typeof minutes !== 'string') {
            invalidRestartWarningMinutes.push(`"${minutes}"`);
        } else {
            const minutesAttempt = parseInt(minutes);
            if (isNaN(minutesAttempt)) {
                invalidRestartWarningMinutes.push(`"${minutes}"`);
            } else if (minutesAttempt < 1 || minutesAttempt > 360) {
                invalidRestartWarningMinutes.push(minutesAttempt);
            } else {
                validRestartWarningMinutes.push(parseInt(minutes));
            }
        }
    });
    if (invalidRestartWarningMinutes.length) {
        let message = '<strong>The following entries were not recognized as valid minutes before restart warning:</strong><br>';
        message += invalidRestartWarningMinutes.join('<br>\n');
        return ctx.send({type: 'danger', message: message});
    }

    //Preparing & saving config
    const newConfig = globals.configVault.getScopedStructure('monitor');
    newConfig.restarterSchedule = validRestartTimes;
    newConfig.restarterScheduleWarnings = validRestartWarningMinutes.sort((a, b) => b - a);
    newConfig.disableChatWarnings = cfg.disableChatWarnings;
    const saveStatus = globals.configVault.saveProfile('monitor', newConfig);

    //Sending output
    if (saveStatus) {
        globals.monitor.refreshConfig();
        ctx.utils.logAction('Changing monitor settings.');
        return ctx.send({type: 'success', message: '<strong>Monitor/Restarter configuration saved!</strong>'});
    } else {
        logWarn(`[${ctx.session.auth.username}] Error changing monitor settings.`);
        return ctx.send({type: 'danger', message: '<strong>Error saving the configuration file.</strong>'});
    }
}


//================================================================
/**
 * Handle Discord settings
 * @param {object} ctx
 */
function handleDiscord(ctx) {
    //Sanity check
    if (
        isUndefined(ctx.request.body.enabled)
        || isUndefined(ctx.request.body.token)
        || isUndefined(ctx.request.body.announceChannel)
        || isUndefined(ctx.request.body.prefix)
        || isUndefined(ctx.request.body.statusMessage)
    ) {
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    //Prepare body input
    let cfg = {
        enabled: (ctx.request.body.enabled === 'true'),
        token: ctx.request.body.token.trim(),
        announceChannel: ctx.request.body.announceChannel.trim(),
        prefix: ctx.request.body.prefix.trim(),
        statusMessage: ctx.request.body.statusMessage.trim(),
    };

    //Preparing & saving config
    let newConfig = globals.configVault.getScopedStructure('discordBot');
    newConfig.enabled = cfg.enabled;
    newConfig.token = cfg.token;
    newConfig.announceChannel = (cfg.announceChannel.length) ? cfg.announceChannel : false;
    newConfig.prefix = cfg.prefix;
    newConfig.statusMessage = cfg.statusMessage;
    let saveStatus = globals.configVault.saveProfile('discordBot', newConfig);

    //Sending output
    if (saveStatus) {
        globals.discordBot.refreshConfig();
        ctx.utils.logAction('Changing discordBot settings.');
        if (newConfig.enabled) {
            return ctx.send({type: 'warning', message: '<strong>Discord configuration saved. Check terminal to make sure the token is valid.</strong>'});
        } else {
            return ctx.send({type: 'success', message: '<strong>Discord configuration saved!</strong>'});
        }
    } else {
        logWarn(`[${ctx.session.auth.username}] Error changing discordBot settings.`);
        return ctx.send({type: 'danger', message: '<strong>Error saving the configuration file.</strong>'});
    }
}
