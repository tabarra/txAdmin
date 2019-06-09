
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
    logError('Server config file not set. You must start FXAdmin with the command "npm start example.json", with "example.json" being the name of the file containing your FXAdmin server configuration inside the data folder. This file should be based on the server-template.json file.', context);
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
let configFile = null;
try {
    let raw = fs.readFileSync(`data/${configName}.json`);  
    configFile = JSON.parse(raw);
} catch (error) {
    logError(`Unnable to load configuration file 'data/${configName}.json'`, context);
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
//FIXME: the bool trick in global.verbose and fxRunner.autostart won't work if we want the default to be true
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
        logPath: configFile.logger.logPath || `data/log_${configName}.txt`, //removed from template
    };
    cfg.monitor = {
        interval: parseInt(configFile.monitor.interval) || 1000, //removed from template
        timeout: parseInt(configFile.monitor.timeout) || 1000,
        restarter: {
            cooldown: parseInt(configFile.monitor.restarter.cooldown) || 60, //removed from template
            failures: parseInt(configFile.monitor.restarter.failures) || 15,
            schedule: configFile.monitor.restarter.schedule || []
        }
    };
    cfg.authenticator = {
        adminsFilePath: configFile.authenticator.adminsFilePath || 'data/admins.json',
        refreshInterval: parseInt(configFile.authenticator.refreshInterval) || 15000, //removed from template
    };
    cfg.webServer = {
        port: parseInt(configFile.webServer.port) || 40121,
        bufferTime: parseInt(configFile.webServer.bufferTime) || 1500, //removed from template - deprecate?
        limiterMinutes: parseInt(configFile.webServer.limiterMinutes) || 15, //removed from template
        limiterAttempts: parseInt(configFile.webServer.limiterAttempts) || 5, //removed from template
    };
    cfg.webConsole = {
        //nothing to configure
    };
    cfg.discordBot = {
        enabled: (configFile.discordBot.enabled === 'true' || configFile.discordBot.enabled === true),
        token:  configFile.discordBot.token || ((configFile.discordBot.enabled === 'true' || configFile.discordBot.enabled === true) && fatalRequired('discordBot.token')),
        trigger: configFile.discordBot.trigger || "/status",
    };
    cfg.fxRunner = {
        buildPath: configFile.fxRunner.buildPath || fatalRequired('fxRunner.buildPath'),
        basePath: configFile.fxRunner.basePath || fatalRequired('fxRunner.basePath'),
        cfgPath: configFile.fxRunner.cfgPath || fatalRequired('fxRunner.cfgPath'),
        onesync: (configFile.fxRunner.onesync === 'true' || configFile.fxRunner.onesync === true),
        autostart: (configFile.fxRunner.autostart === 'true' || configFile.fxRunner.autostart === true),
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
