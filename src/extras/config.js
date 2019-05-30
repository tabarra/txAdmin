
//Requires
const fs = require('fs');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'Config Exporter';

function fatalRequired(varName){
    logError(`The following variable was not set and is required: '${varName}'`, context);
    process.exit(0);
}


//Try to load configuration
//TODO: create a lock file to prevent starting twice the same config file?
let configFilePath = null;
if(process.argv[2]){
    configFilePath = (process.argv[2].endsWith('.json'))? `data/${process.argv[2]}` : `data/${process.argv[2]}.json`
}else{
    logError('Server config file not set. You must start FXAdmin with the command "npm start example.json", with "example.json" being the name of the file containing your FXAdmin server configuration inside the data folder. This file should be based on the server-template.json file.', context);
    process.exit(0);
}
let configFile = null;
try {
    let raw = fs.readFileSync(configFilePath);  
    configFile = JSON.parse(raw);
} catch (error) {
    logError(`Unnable to load configuration file '${configFilePath}'`, context);
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
try {
    cfg.global = {
        verbose: (configFile.global.verbose === 'true' || configFile.global.verbose === true),
        publicIP: configFile.global.publicIP || "change-me",
    };
    cfg.logger = {
        logPath: configFile.logger.logPath || 'data/log.txt',
    };
    cfg.monitor = {
        interval: parseInt(configFile.monitor.interval) || 1000,
        timeout: parseInt(configFile.monitor.timeout) || 1000,
        fxServerPort: parseInt(configFile.monitor.fxServerPort) || fatalRequired('monitor.fxServerPort'),
    };
    cfg.authenticator = {
        adminsFilePath: configFile.authenticator.adminsFilePath || 'data/admins.json',
        refreshInterval: parseInt(configFile.authenticator.refreshInterval) || 15000,
    };
    cfg.webServer = {
        port: parseInt(configFile.webServer.port) || 40121,
        bufferTime: parseInt(configFile.webServer.bufferTime) || 1500,
    };
    cfg.webConsole = {
        //nothing yet
    };
    cfg.discordBot = {
        enabled: (configFile.discordBot.enabled === 'true' || configFile.discordBot.enabled === true),
        token:  configFile.discordBot.token || ((configFile.discordBot.enabled === 'true' || configFile.discordBot.enabled === true) && fatalRequired('discordBot.token')),
        activity: configFile.discordBot.activity || "Running FXServer",
        trigger: configFile.discordBot.trigger || "/status",
    };
    cfg.fxRunner = {
        buildPath: configFile.fxRunner.buildPath || fatalRequired('fxRunner.buildPath'),
        basePath: configFile.fxRunner.basePath || fatalRequired('fxRunner.basePath'),
        cfgPath: configFile.fxRunner.cfgPath || fatalRequired('fxRunner.cfgPath'),
        onesync: (configFile.fxRunner.onesync === 'true' || configFile.fxRunner.onesync === true),
        isLinux: (configFile.fxRunner.isLinux === 'true' || configFile.fxRunner.isLinux === true),
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
