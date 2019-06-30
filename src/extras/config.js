
//Requires
const os = require('os');
const fs = require('fs');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'ConfigExporter';

//Helper Functions
function fatalRequired(varName){
    logError(`The following configuration was not set and is required: '${varName}'`, context);
    process.exit(0);
}


//Check argv
let serverProfile;
if(process.argv[2]){
    serverProfile = process.argv[2].trim();
    log(`Server profile selected: '${serverProfile}'`, context);
}else{
    serverProfile = 'default';
    log(`Server profile not set, using default`, context);
}

//Try to load config file
//TODO: create a lock file to prevent starting twice the same config file?
let serverProfilePath = `data/${serverProfile}`;
let configFilePath = `${serverProfilePath}/config.json`;
let rawFile = null;
try {
    rawFile = fs.readFileSync(configFilePath, 'utf8');
} catch (error) {
    logError(`Unnable to load configuration file '${configFilePath}'. (cannot read file, please read the documentation)`, context);
    process.exit(0)
}

//Try to parse config file
let configFile = null;
try {
    configFile = JSON.parse(rawFile);
} catch (error) {
    logError(`Unnable to load configuration file '${configFilePath}'. (json parse error, please read the documentation)`, context);
    if(rawFile.includes('\\')) logError(`Note: your '${serverProfile}.json' file contains '\\', make sure all your paths use only '/'.`, context)
    process.exit();
}

//Create server folder structure if doesn't exist
try {
    let dataPath = `${serverProfilePath}/data/`;
    if(!fs.existsSync(dataPath)){
        fs.mkdirSync(dataPath);
    }
    
    let messagesPath = `${serverProfilePath}/messages.json`;
    if(!fs.existsSync(messagesPath)){
        fs.writeFileSync(messagesPath, '[]');
    }  
    
    let commandsPath = `${serverProfilePath}/commands.json`;
    if(!fs.existsSync(commandsPath)){
        fs.writeFileSync(commandsPath, '[]');
    }  
} catch (error) {
    logError(`Error setting up folder structure in '${serverProfilePath}/'`, context);
    logError(error);
    process.exit();
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
        serverProfile: serverProfile,
        serverProfilePath: serverProfilePath
    };
    cfg.logger = {
        logPath: configFile.logger.logPath || `${serverProfilePath}/data/admin.log`, //not in template 
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
        messagesFilePath: configFile.discordBot.messagesFilePath || `${serverProfilePath}/messages.json`, //not in template
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
    dir(error);
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
