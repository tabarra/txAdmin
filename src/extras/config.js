
//Requires
const os = require('os');
const fs = require('fs');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'Config Exporter';

//Helper Functions
function fatalRequired(varName){
    logError(`The following configuration was not set and is required: '${varName}'`, context);
    process.exit(0);
}

//Check  argv
if(!process.argv[2]){
    logError('Server config file not set. You must start txAdmin with the command "npm start example.json", with "example.json" being the name of the file containing your txAdmin server configuration inside the data folder. This file should be based on the server-template.json file.', context);
    process.exit(0);
}

//Get config name
let configName = null;
if(process.argv[2].endsWith('.json')){
    configName = process.argv[2].substring(0, process.argv[2].length-5);
}else{
    configName = process.argv[2];
}

//Try to load configuration
//TODO: create a lock file to prevent starting twice the same config file?
let rawFile = null;
try {
    rawFile = fs.readFileSync(`data/${configName}.json`, 'utf8');
} catch (error) {
    logError(`Unnable to load configuration file 'data/${configName}.json'. (cannot read file, please read the documentation)`, context);
    process.exit(0)
}

let configFile = null;
try {
    configFile = JSON.parse(rawFile);
} catch (error) {
    logError(`Unnable to load configuration file 'data/${configName}.json'. (json parse error, please read the documentation)`, context);
    if(rawFile.includes('\\')) logError(`Note: your '${configName}.json' file contains '\\', make sure all your paths use only '/'.`, context)
    process.exit(0)
}


let cfg = {
    global: null,
    logger: null,
    monitor: null,
    authenticator: null,
    webServer: null,
    webConsole: null,
    discordBot: null,
    fxRunner: null,
}
//Read config and Set defaults
//NOTE: the bool trick in global.verbose and fxRunner.autostart won't work if we want the default to be true
//NOTE: Some settings here were removed from the config template file to look less intimidating. Put them in the docs ASAP.
try {
    cfg.global = {
        verbose: (configFile.global.verbose === 'true' || configFile.global.verbose === true),
        publicIP: configFile.global.publicIP || "change-me",
        serverName: configFile.global.serverName || "change-me",
        fxServerPort: parseInt(configFile.global.fxServerPort) || fatalRequired('global.fxServerPort'),
        
        //Extras
        osType: os.type() || 'unknown',
        configName: configName,
    };
    cfg.logger = {
        logPath: configFile.logger.logPath || `data/${configName}.log`, //not in template
    };
    cfg.monitor = {
        interval: parseInt(configFile.monitor.interval) || 1000, //not in template
        timeout: parseInt(configFile.monitor.timeout) || 1000,
        restarter: {
            cooldown: parseInt(configFile.monitor.restarter.cooldown) || 120, //not in template
            failures: parseInt(configFile.monitor.restarter.failures) || 15,
            schedule: configFile.monitor.restarter.schedule || []
        }
    };
    cfg.authenticator = {
        adminsFilePath: configFile.authenticator.adminsFilePath || 'data/admins.json',
        refreshInterval: parseInt(configFile.authenticator.refreshInterval) || 15000, //not in template
    };
    cfg.webServer = {
        port: parseInt(configFile.webServer.port) || 40121,
        bufferTime: parseInt(configFile.webServer.bufferTime) || 1500, //not in template - deprecate?
        limiterMinutes: parseInt(configFile.webServer.limiterMinutes) || 15, //not in template
        limiterAttempts: parseInt(configFile.webServer.limiterAttempts) || 5, //not in template
    };
    cfg.webConsole = {
        //nothing to configure
    };
    cfg.discordBot = {
        enabled: (configFile.discordBot.enabled === 'true' || configFile.discordBot.enabled === true),
        token:  configFile.discordBot.token || ((configFile.discordBot.enabled === 'true' || configFile.discordBot.enabled === true) && fatalRequired('discordBot.token')),
        messagesFilePath: configFile.discordBot.messagesFilePath || 'data/messages.json',
        refreshInterval: parseInt(configFile.discordBot.refreshInterval) || 15000, //not in template
        statusCommand: configFile.discordBot.statusCommand || "/status",
    };
    cfg.fxRunner = {
        buildPath: configFile.fxRunner.buildPath || fatalRequired('fxRunner.buildPath'),
        basePath: configFile.fxRunner.basePath || fatalRequired('fxRunner.basePath'),
        cfgPath: configFile.fxRunner.cfgPath || fatalRequired('fxRunner.cfgPath'),
        setPriority: configFile.fxRunner.setPriority || "NORMAL",
        onesync: (configFile.fxRunner.onesync === 'true' || configFile.fxRunner.onesync === true),
        autostart: (configFile.fxRunner.autostart === 'true' || configFile.fxRunner.autostart === true),
        autostartDelay: parseInt(configFile.webServer.autostartDelay) || 3, //not in template
        quiet: (configFile.fxRunner.quiet === 'true' || configFile.fxRunner.quiet === true), //not in template
    };
} catch (error) {
    logError('Malformed configuration file! Please copy server-template.json and try again.', context);
    process.exit(0);
}

//Export AND FREEZE the settings
module.exports = {
    global: Object.freeze(cfg.global),
    logger: Object.freeze(cfg.logger),
    monitor: Object.freeze(cfg.monitor),
    authenticator: Object.freeze(cfg.authenticator),
    webServer: Object.freeze(cfg.webServer),
    webConsole: Object.freeze(cfg.webConsole),
    discordBot: Object.freeze(cfg.discordBot),
    fxRunner: Object.freeze(cfg.fxRunner),
}
