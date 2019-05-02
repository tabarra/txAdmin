
//Requires
const fs = require('fs');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');

function fatalRequired(varName){
    logError(`The following variable was not set and is required: '${varName}'`, 'Config Exporter');
    process.exit(0);
}


//Try to load configuration
//TODO: get the configFilePath from the arguments
let configFilePath = 'data/config.json';
let configFile = null;
try {
    let raw = fs.readFileSync(configFilePath);  
    configFile = JSON.parse(raw);
} catch (error) {
    dir(error)
    logError(`Unnable to load configuration file '${configFilePath}'`, 'Config Exporter');
    process.exit(0)
}


//Set defaults
let monitor = {
    interval: parseInt(configFile.monitor.interval) || 1000,
    timeout: parseInt(configFile.monitor.timeout) || 1000,
    fxServerPort: parseInt(configFile.monitor.fxServerPort) || fatalRequired('monitor.fxServerPort'),
};
let authenticator = {
    adminsFilePath: configFile.authenticator.adminsFilePath || 'data/admins.json',
    logPath: configFile.authenticator.logPath || 'data/log.txt',
    refreshInterval: parseInt(configFile.authenticator.refreshInterval) || 15000,
};
let webServer = {
    port: parseInt(configFile.webServer.port) || 40121,
    bufferTime: parseInt(configFile.webServer.bufferTime) || 1500,
};
let fxServer = {
    serverPath: configFile.fxServer.serverPath || fatalRequired('fxServer.serverPath'),
    cfgPath: configFile.fxServer.cfgPath || fatalRequired('fxServer.cfgPath'),
    resPath: configFile.fxServer.resPath || fatalRequired('fxServer.resPath'),
    autostart: (configFile.fxServer.autostart === true) || false,
};


//Export AND FREEZE the settings
module.exports = {
    monitor: Object.freeze(monitor),
    authenticator: Object.freeze(authenticator),
    webServer: Object.freeze(webServer),
    fxServer: Object.freeze(fxServer),
}
