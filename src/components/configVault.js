//Requires
const modulename = 'ConfigVault';
const fs = require('fs');
const clone = require('clone');
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);

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
    constructor(profilePath, serverProfile) {
        this.serverProfile = serverProfile;
        this.serverProfilePath = profilePath;
        this.configFilePath = `${this.serverProfilePath}/config.json`;
        this.configFile = null;
        this.config = null;

        this.setupVault();
        logOk('Started');
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
            logError(error.message)
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
            throw new Error(`Unnable to load configuration file '${this.configFilePath}'. (cannot read file, please read the documentation)\nOriginal error: ${error.message}`);
        }

        //Try to parse config file
        let cfgData = null;
        try {
            cfgData = JSON.parse(rawFile);
        } catch (error) {
            if(rawFile.includes('\\')) logError(`Note: your 'txData/${this.serverProfile}/config.json' file contains '\\', make sure all your paths use only '/'.`);
            throw new Error(`Unnable to load configuration file '${this.configFilePath}'. \nOriginal error: ${error.message}`);
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
            discordBot: null,
            fxRunner: null,
        }

        try {
            out.global = {
                serverName:  toDefault(cfg.global.serverName, null),
                language:  toDefault(cfg.global.language, null),
                forceFXServerPort:  toDefault(cfg.global.forceFXServerPort, null), //not in template
            };
            out.logger = {
                logPath: toDefault(cfg.logger.logPath, null), //not in template
            };
            out.monitor = {
                timeout: toDefault(cfg.monitor.timeout, null),
                restarterSchedule: toDefault(cfg.monitor.restarterSchedule, null),
                cooldown: toDefault(cfg.monitor.cooldown, null), //not in template
                heartBeat: {
                    failThreshold: (cfg.monitor.heartBeat)? toDefault(cfg.monitor.heartBeat.failThreshold, null) : null,
                    failLimit: (cfg.monitor.heartBeat)? toDefault(cfg.monitor.heartBeat.failLimit, null) : null,
                },
                healthCheck: {
                    failThreshold: (cfg.monitor.healthCheck)? toDefault(cfg.monitor.healthCheck.failThreshold, null) : null,
                    failLimit: (cfg.monitor.healthCheck)? toDefault(cfg.monitor.healthCheck.failLimit, null) : null,
                }
            };
            out.authenticator = {
                refreshInterval: toDefault(cfg.authenticator.refreshInterval, null), //not in template
            };
            out.webServer = {
                bufferTime: toDefault(cfg.webServer.bufferTime, null), //not in template - deprecate?
                limiterMinutes: toDefault(cfg.webServer.limiterMinutes, null), //not in template
                limiterAttempts: toDefault(cfg.webServer.limiterAttempts, null), //not in template
            };
            out.discordBot = {
                enabled: toDefault(cfg.discordBot.enabled, null),
                token:  toDefault(cfg.discordBot.token, null),
                announceChannel:  toDefault(cfg.discordBot.announceChannel, null),
                statusCommand: toDefault(cfg.discordBot.statusCommand, '/status'),
                statusMessage: toDefault(cfg.discordBot.statusMessage, '**IP:** \`change-me:<port>\`\n**Players:** <players>\n**Uptime:** <uptime>'),
                commandCooldown: toDefault(cfg.discordBot.commandCooldown, null), //not in template
            };
            out.fxRunner = {
                serverDataPath: toDefault(cfg.fxRunner.serverDataPath, null) || toDefault(cfg.fxRunner.basePath, null), //converting old variable
                cfgPath: toDefault(cfg.fxRunner.cfgPath, null),
                commandLine: toDefault(cfg.fxRunner.commandLine, null),
                logPath: toDefault(cfg.fxRunner.logPath, null), //not in template
                onesync: toDefault(cfg.fxRunner.onesync, null),
                autostart: toDefault(cfg.fxRunner.autostart, null),
                autostartDelay: toDefault(cfg.fxRunner.autostartDelay, null), //not in template
                restartDelay: toDefault(cfg.fxRunner.restartDelay, null), //not in template
                quiet: toDefault(cfg.fxRunner.quiet, null),
            };
        } catch (error) {
            throw new Error(`Malformed configuration file! Please copy server-template.json and try again.\nOriginal error: ${error.message}`);
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
        //NOTE: the bool trick in fxRunner.autostart won't work if we want the default to be true
        try {
            //Global
            cfg.global.serverName = cfg.global.serverName || "change-me";
            cfg.global.language = cfg.global.language || "en"; //TODO: move to GlobalData

            //Logger
            cfg.logger.logPath = cfg.logger.logPath || `${this.serverProfilePath}/logs/admin.log`; //not in template

            //Monitor
            cfg.monitor.timeout = cfg.monitor.timeout || 1500;
            cfg.monitor.restarterSchedule = cfg.monitor.restarterSchedule || [];
            cfg.monitor.cooldown = parseInt(cfg.monitor.cooldown) || 60; //not in template
            cfg.monitor.heartBeat.failThreshold = parseInt(cfg.monitor.heartBeat.failThreshold) || 10;
            cfg.monitor.heartBeat.failLimit = parseInt(cfg.monitor.heartBeat.failLimit) || 45;
            cfg.monitor.healthCheck.failThreshold = parseInt(cfg.monitor.healthCheck.failThreshold) || 10;
            cfg.monitor.healthCheck.failLimit = parseInt(cfg.monitor.healthCheck.failLimit) || 300;

            //Authenticator
            cfg.authenticator.refreshInterval = parseInt(cfg.authenticator.refreshInterval) || 15000; //not in template

            //WebServer
            cfg.webServer.bufferTime = parseInt(cfg.webServer.bufferTime) || 1500; //not in template - deprecate?
            cfg.webServer.limiterMinutes = parseInt(cfg.webServer.limiterMinutes) || 15; //not in template
            cfg.webServer.limiterAttempts = parseInt(cfg.webServer.limiterAttempts) || 10; //not in template

            //DiscordBot
            cfg.discordBot.enabled = (cfg.discordBot.enabled === 'true' || cfg.discordBot.enabled === true);
            cfg.discordBot.statusCommand = cfg.discordBot.statusCommand || '/status';
            cfg.discordBot.statusMessage = cfg.discordBot.statusMessage || '**IP:** \`change-me:<port>\`\n**Players:** <players>\n**Uptime:** <uptime>';
            cfg.discordBot.commandCooldown = parseInt(cfg.discordBot.commandCooldown) || 30; //not in template

            //FXRunner
            cfg.fxRunner.logPath = cfg.fxRunner.logPath || `${this.serverProfilePath}/logs/fxserver.log`; //not in template
            cfg.fxRunner.onesync = (cfg.fxRunner.onesync === 'true' || cfg.fxRunner.onesync === true);
            cfg.fxRunner.autostart = (cfg.fxRunner.autostart === 'true' || cfg.fxRunner.autostart === true);
            cfg.fxRunner.autostartDelay = parseInt(cfg.fxRunner.autostartDelay) || 2; //not in template
            cfg.fxRunner.restartDelay = parseInt(cfg.fxRunner.restartDelay) || 1250; //not in templater
            cfg.fxRunner.quiet = (cfg.fxRunner.quiet === 'true' || cfg.fxRunner.quiet === true);
        } catch (error) {
            throw new Error(`Malformed configuration file! Please copy server-template.json and try again.\nOriginal error: ${error.message}`);
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
        } catch (error) {
            logError(`Failed to set up folder structure in '${this.serverProfilePath}/' with error: ${error.message}`);
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
