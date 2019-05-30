
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


//Set defaults
//FIXME: the bool trick in global.verbose and fxServer.autostart won't work if we want the default to be true
let global = {
    verbose: (configFile.global.verbose === 'true' || configFile.global.verbose === true),
    publicIP: configFile.global.publicIP || "change-me",
};
let logger = {
    logPath: configFile.logger.logPath || 'data/log.txt',
};
let monitor = {
    interval: parseInt(configFile.monitor.interval) || 1000,
    timeout: parseInt(configFile.monitor.timeout) || 1000,
    fxServerPort: parseInt(configFile.monitor.fxServerPort) || fatalRequired('monitor.fxServerPort'),
};
let authenticator = {
    adminsFilePath: configFile.authenticator.adminsFilePath || 'data/admins.json',
    refreshInterval: parseInt(configFile.authenticator.refreshInterval) || 15000,
};
let webServer = {
    port: parseInt(configFile.webServer.port) || 40121,
    bufferTime: parseInt(configFile.webServer.bufferTime) || 1500,
};
let webConsole = {
    //
};
let discordBot = {
    enabled: (configFile.discordBot.enabled === 'true' || configFile.discordBot.enabled === true),
    token:  configFile.discordBot.token || ((configFile.discordBot.enabled === 'true' || configFile.discordBot.enabled === true) && fatalRequired('discordBot.token')),
    activity: configFile.discordBot.activity || "Running FXServer",
    trigger: configFile.discordBot.trigger || "/status",
};
let fxServer = {
    buildPath: configFile.fxServer.buildPath || fatalRequired('fxServer.buildPath'),
    basePath: configFile.fxServer.basePath || fatalRequired('fxServer.basePath'),
    cfgPath: configFile.fxServer.cfgPath || fatalRequired('fxServer.cfgPath'),
    onesync: (configFile.fxServer.onesync === 'true' || configFile.fxServer.onesync === true),
    isLinux: (configFile.fxServer.isLinux === 'true' || configFile.fxServer.isLinux === true),
    autostart: (configFile.fxServer.autostart === 'true' || configFile.fxServer.autostart === true),
};


//Export AND FREEZE the settings
module.exports = {
    global: Object.freeze(global),
    logger: Object.freeze(logger),
    monitor: Object.freeze(monitor),
    authenticator: Object.freeze(authenticator),
    webServer: Object.freeze(webServer),
    webConsole: Object.freeze(webConsole),
    discordBot: Object.freeze(discordBot),
    fxServer: Object.freeze(fxServer),
}
