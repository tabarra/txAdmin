//Requires
const os = require('os');
const fs = require('fs');
const clone = require('clone');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'ConfigVault';

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined') };
const toDefault = (input, defVal) => { return (isUndefined(input))? defVal : input };
function removeNulls(obj) {
    var isArray = obj instanceof Array;
    for (var k in obj) {
        if (obj[k] === null) isArray ? obj.splice(k, 1) : delete obj[k];
        else if (typeof obj[k] == "object") removeNulls(obj[k]);
        if (isArray && obj.length == k) removeNulls(obj);
    }
    return obj;
}


module.exports = class ConfigVault {
    constructor(serverProfile) {
        this.serverProfile = serverProfile;
        this.serverProfilePath = `data/${serverProfile}`;
        this.configFilePath = `${this.serverProfilePath}/config.json`;
        this.configFile = null;
        this.config = null;

        this.setupVault();
        logOk('::Started', context);
    }


    //================================================================
    /**
     * Setup Vault
     */
    setupVault(){
        try {
            let cfgData = this.getConfigFromFile();
            this.configFile = this.setupConfigStructure(cfgData);
            this.config = this.setupConfigDefaults(this.configFile);
            this.setupFolderStructure();
        } catch (error) {
            logError(error.stack, context)
            process.exit(0);
        }
    }


    //================================================================
    /**
     * Returns the config file data
     */
    getConfigFromFile(){
        //Try to load config file
        //TODO: create a lock file to prevent starting twice the same config file?
        let rawFile = null;
        try {
            rawFile = fs.readFileSync(this.configFilePath, 'utf8');
        } catch (error) {
            throw new Error(`Unnable to load configuration file '${this.configFilePath}'. (cannot read file, please read the documentation)\nOriginal error: ${error.message}`, error.stack);
        }

        //Try to parse config file
        let cfgData = null;
        try {
            cfgData = JSON.parse(rawFile);
        } catch (error) {
            if(rawFile.includes('\\')) logError(`Note: your '${this.serverProfile}.json' file contains '\\', make sure all your paths use only '/'.`, context);
            throw new Error(`Unnable to load configuration file '${this.configFilePath}'. (json parse error, please read the documentation)\nOriginal error: ${error.message}`, error.stack);
        }

        return cfgData;
    }


    //================================================================
    /**
     * Setup the this.config variable based on the config file data
     * @param {object} cfgData
     */
    setupConfigStructure(cfgData){
        let cfg = clone(cfgData);
        let out = {
            global: null,
            logger: null,
            monitor: null,
            authenticator: null,
            webServer: null,
            webConsole: null,
            discordBot: null,
            fxRunner: null,
        }

        try {
            out.global = {
                verbose: toDefault(cfg.global.verbose, null),
                publicIP:  toDefault(cfg.global.publicIP, null),
                serverName:  toDefault(cfg.global.serverName, null),
                forceFXServerPort:  toDefault(cfg.global.forceFXServerPort, null),
            };
            out.logger = {
                logPath: toDefault(cfg.logger.logPath, null), //not in template
            };
            out.monitor = {
                interval: toDefault(cfg.monitor.interval, null), //not in template
                timeout: toDefault(cfg.monitor.timeout, null),
                restarter: {
                    cooldown: toDefault(cfg.monitor.restarter.cooldown, null), //not in template
                    failures: toDefault(cfg.monitor.restarter.failures, null),
                    schedule: toDefault(cfg.monitor.restarter.schedule, null),
                }
            };
            out.authenticator = {
                refreshInterval: toDefault(cfg.authenticator.refreshInterval, null), //not in template
            };
            out.webServer = {
                port: toDefault(cfg.webServer.port, null),
                bufferTime: toDefault(cfg.webServer.bufferTime, null), //not in template - deprecate?
                limiterMinutes: toDefault(cfg.webServer.limiterMinutes, null), //not in template
                limiterAttempts: toDefault(cfg.webServer.limiterAttempts, null), //not in template
            };
            out.webConsole = {
                //nothing to configure
            };
            out.discordBot = {
                enabled: toDefault(cfg.discordBot.enabled, null),
                token:  toDefault(cfg.discordBot.token, null),
                announceChannel:  toDefault(cfg.discordBot.announceChannel, null),
                messagesFilePath: toDefault(cfg.discordBot.messagesFilePath, null), //not in template
                refreshInterval: toDefault(cfg.discordBot.refreshInterval, null), //not in template
                statusCommand: toDefault(cfg.discordBot.statusCommand, null),
            };
            out.fxRunner = {
                buildPath: toDefault(cfg.fxRunner.buildPath, null),
                basePath: toDefault(cfg.fxRunner.basePath, null),
                cfgPath: toDefault(cfg.fxRunner.cfgPath, null),
                logPath: toDefault(cfg.fxRunner.logPath, null), //not in template
                setPriority: toDefault(cfg.fxRunner.setPriority, null),
                onesync: toDefault(cfg.fxRunner.onesync, null),
                autostart: toDefault(cfg.fxRunner.autostart, null),
                autostartDelay: toDefault(cfg.webServer.autostartDelay, null), //not in template
                quiet: toDefault(cfg.fxRunner.quiet, null),
            };
        } catch (error) {
            throw new Error(`Malformed configuration file! Please copy server-template.json and try again.\nOriginal error: ${error.message}`, error.stack);
        }

        return out;
    }


    //================================================================
    /**
     * Setup the this.config variable based on the config file data
     * FIXME: rename this function
     * @param {object} cfgData
     */
    setupConfigDefaults(cfgData){
        let cfg = clone(cfgData);
        //NOTE: the bool trick in global.verbose and fxRunner.autostart won't work if we want the default to be true
        try {
            //Global
            cfg.global.verbose = (cfg.global.verbose === 'true' || cfg.global.verbose === true);
            cfg.global.publicIP = cfg.global.publicIP || "change-me";
            cfg.global.serverName = cfg.global.serverName || "change-me";

            //Global - Extras
            cfg.global.osType = os.type() || 'unknown';
            cfg.global.serverProfile = this.serverProfile;
            cfg.global.serverProfilePath = this.serverProfilePath;

            //Logger
            cfg.logger.logPath = cfg.logger.logPath || `${this.serverProfilePath}/logs/admin.log`; //not in template

            //Monitor
            cfg.monitor.interval = parseInt(cfg.monitor.interval) || 1000; //not in template
            cfg.monitor.timeout = parseInt(cfg.monitor.timeout) || 1000;
            cfg.monitor.restarter.cooldown = parseInt(cfg.monitor.restarter.cooldown) || 120; //not in template
            cfg.monitor.restarter.failures = parseInt(cfg.monitor.restarter.failures) || 30;
            cfg.monitor.restarter.schedule = cfg.monitor.restarter.schedule || [];

            //Authenticator
            cfg.authenticator.refreshInterval = parseInt(cfg.authenticator.refreshInterval) || 15000; //not in template

            //WebServer
            cfg.webServer.port = parseInt(cfg.webServer.port) || 40120;
            cfg.webServer.bufferTime = parseInt(cfg.webServer.bufferTime) || 1500; //not in template - deprecate?
            cfg.webServer.limiterMinutes = parseInt(cfg.webServer.limiterMinutes) || 15; //not in template
            cfg.webServer.limiterAttempts = parseInt(cfg.webServer.limiterAttempts) || 5; //not in template

            //DiscordBot
            cfg.discordBot.enabled = (cfg.discordBot.enabled === 'true' || cfg.discordBot.enabled === true);
            cfg.discordBot.messagesFilePath = cfg.discordBot.messagesFilePath || `${this.serverProfilePath}/messages.json`; //not in template
            cfg.discordBot.refreshInterval = parseInt(cfg.discordBot.refreshInterval) || 15000; //not in template
            cfg.discordBot.statusCommand = cfg.discordBot.statusCommand || "/status";

            //FXRunner
            cfg.fxRunner.logPath = cfg.fxRunner.logPath || `${this.serverProfilePath}/logs/fxserver.log`; //not in template
            cfg.fxRunner.setPriority = cfg.fxRunner.setPriority || "NORMAL";
            cfg.fxRunner.onesync = (cfg.fxRunner.onesync === 'true' || cfg.fxRunner.onesync === true);
            cfg.fxRunner.autostart = (cfg.fxRunner.autostart === 'true' || cfg.fxRunner.autostart === true);
            cfg.fxRunner.autostartDelay = parseInt(cfg.webServer.autostartDelay) || 3; //not in template
            cfg.fxRunner.quiet = (cfg.fxRunner.quiet === 'true' || cfg.fxRunner.quiet === true);
        } catch (error) {
            throw new Error(`Malformed configuration file! Please copy server-template.json and try again.\nOriginal error: ${error.message}`, error.stack);
        }

        return cfg;
    }


    //================================================================
    /**
     * Create server profile folder structure if doesn't exist
     */
    setupFolderStructure(){
        try {
            let dataPath = `${this.serverProfilePath}/data/`;
            if(!fs.existsSync(dataPath)){
                fs.mkdirSync(dataPath);
            }

            let logsPath = `${this.serverProfilePath}/logs/`;
            if(!fs.existsSync(logsPath)){
                fs.mkdirSync(logsPath);
            }

            let messagesPath = `${this.serverProfilePath}/messages.json`;
            if(!fs.existsSync(messagesPath)){
                fs.writeFileSync(messagesPath, '[]');
            }

            let commandsPath = `${this.serverProfilePath}/commands.json`;
            if(!fs.existsSync(commandsPath)){
                fs.writeFileSync(commandsPath, '[]');
            }
        } catch (error) {
            logError(`Error setting up folder structure in '${this.serverProfilePath}/'`, context);
            logError(error);
            process.exit();
        }
    }


    //================================================================
    /**
     * Return configs for a specific scope (reconstructed and freezed)
     */
    getScoped(scope){
        return clone(this.config[scope]);
    }

    //================================================================
    /**
     * Return configs for a specific scope (reconstructed and freezed)
     */
    getScopedStructure(scope){
        return clone(this.configFile[scope]);
    }


    //================================================================
    /**
     * Return all configs individually reconstructed and freezed
     */
    getAll(){
        let cfg = clone(this.config);
        return {
            global: Object.freeze(cfg.global),
            logger: Object.freeze(cfg.logger),
            monitor: Object.freeze(cfg.monitor),
            authenticator: Object.freeze(cfg.authenticator),
            webServer: Object.freeze(cfg.webServer),
            webConsole: Object.freeze(cfg.webConsole),
            discordBot: Object.freeze(cfg.discordBot),
            fxRunner: Object.freeze(cfg.fxRunner),
        };
    }


    //================================================================
    /**
     * Save the new scope to this context, then saves it to the configFile
     * @param {string} scope
     * @param {string} newConfig
     */
    saveProfile(scope, newConfig){
        try {
            let toSave = clone(this.configFile);
            toSave[scope] = newConfig;
            toSave = removeNulls(toSave);
            fs.writeFileSync(this.configFilePath, JSON.stringify(toSave, null, 2), 'utf8');
            this.configFile = toSave;
            this.config = this.setupConfigDefaults(this.configFile);
            return true;
        } catch (error) {
            dir(error)
            return false;
        }
    }

} //Fim ConfigVault()
