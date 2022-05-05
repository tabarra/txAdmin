//Requires
const modulename = 'ConfigVault';
const fs = require('fs');
const cloneDeep = require('lodash/cloneDeep');
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);

//Helper functions
const isUndefined = (x) => { return (typeof x === 'undefined'); };
const toDefault = (input, defVal) => { return (isUndefined(input)) ? defVal : input; };
const removeNulls = (obj) => {
    const isArray = obj instanceof Array;
    for (let k in obj) {
        if (obj[k] === null) isArray ? obj.splice(k, 1) : delete obj[k];
        else if (typeof obj[k] == 'object') removeNulls(obj[k]);
        if (isArray && obj.length == k) removeNulls(obj);
    }
    return obj;
};
const deepFreeze = (obj) => {
    Object.freeze(obj);
    Object.getOwnPropertyNames(obj).forEach(function (prop) {
        if (obj.hasOwnProperty(prop)
            && obj[prop] !== null
            && (typeof obj[prop] === 'object' || typeof obj[prop] === 'function')
            && !Object.isFrozen(obj[prop])
        ) {
            deepFreeze(obj[prop]);
        }
    });
    return obj;
};

module.exports = class ConfigVault {
    constructor(profilePath, serverProfile) {
        this.serverProfile = serverProfile;
        this.serverProfilePath = profilePath;
        this.configFilePath = `${this.serverProfilePath}/config.json`;
        this.configFile = null;
        this.config = null;

        this.setupVault();
        // logOk('Started');
    }


    //================================================================
    /**
     * Setup Vault
     */
    setupVault() {
        try {
            let cfgData = this.getConfigFromFile();
            this.configFile = this.setupConfigStructure(cfgData);
            this.config = this.setupConfigDefaults(this.configFile);
            this.setupFolderStructure();
        } catch (error) {
            logError(error.message);
            process.exit(0);
        }
    }


    //================================================================
    /**
     * Returns the config file data
     */
    getConfigFromFile() {
        //Try to load config file
        //TODO: create a lock file to prevent starting twice the same config file?
        let rawFile = null;
        try {
            rawFile = fs.readFileSync(this.configFilePath, 'utf8');
        } catch (error) {
            throw new Error(`Unable to load configuration file '${this.configFilePath}'. (cannot read file, please read the documentation)\nOriginal error: ${error.message}`);
        }

        //Try to parse config file
        let cfgData = null;
        try {
            cfgData = JSON.parse(rawFile);
        } catch (error) {
            if (rawFile.includes('\\')) logError(`Note: your 'txData/${this.serverProfile}/config.json' file contains '\\', make sure all your paths use only '/'.`);
            throw new Error(`Unable to load configuration file '${this.configFilePath}'. \nOriginal error: ${error.message}`);
        }

        return cfgData;
    }


    //================================================================
    /**
     * ????????????
     * @param {object} cfgData
     */
    setupConfigStructure(cfgData) {
        let cfg = cloneDeep(cfgData);
        let out = {
            global: null,
            logger: null,
            monitor: null,
            playerController: null,
            webServer: null,
            discordBot: null,
            fxRunner: null,
        };

        //NOTE: this shit is ugly, but I wont bother fixing it.
        //      this entire config vault is stupid.
        //      use convict, lodash defaults or something like that
        if (isUndefined(cfg.playerController)) cfg.playerController = {};

        try {
            out.global = {
                serverName: toDefault(cfg.global.serverName, null),
                language: toDefault(cfg.global.language, null),
                forceFXServerPort: toDefault(cfg.global.forceFXServerPort, null), //not in template
                menuEnabled: toDefault(cfg.global.menuEnabled, true),
                menuAlignRight: toDefault(cfg.global.menuAlignRight, false),
                menuPageKey: toDefault(cfg.global.menuPageKey, 'Tab'),
            };
            out.logger = toDefault(cfg.logger, {}); //not in template
            out.monitor = {
                restarterSchedule: toDefault(cfg.monitor.restarterSchedule, null),
                restarterScheduleWarnings: toDefault(cfg.monitor.restarterScheduleWarnings, [30, 15, 10, 5, 4, 3, 2, 1]), //not in template
                cooldown: toDefault(cfg.monitor.cooldown, null), //not in template
                disableChatWarnings: toDefault(cfg.monitor.disableChatWarnings, null), //not in template
            };
            out.playerController = {
                onJoinCheckBan: toDefault(cfg.playerController.onJoinCheckBan, true),
                onJoinCheckWhitelist: toDefault(cfg.playerController.onJoinCheckWhitelist, false),
                minSessionTime: toDefault(cfg.playerController.minSessionTime, 15),
                whitelistRejectionMessage: toDefault(
                    cfg.playerController.whitelistRejectionMessage,
                    'You are not yet whitelisted in this server.\nPlease join http://discord.gg/example.\nYour Request ID: <id>',
                ),
                wipePendingWLOnStart: toDefault(cfg.playerController.wipePendingWLOnStart, true),
            };
            out.webServer = {
                bufferTime: toDefault(cfg.webServer.bufferTime, null), //not in template - deprecate?
                limiterMinutes: toDefault(cfg.webServer.limiterMinutes, null), //not in template
                limiterAttempts: toDefault(cfg.webServer.limiterAttempts, null), //not in template
            };
            out.discordBot = {
                enabled: toDefault(cfg.discordBot.enabled, null),
                token: toDefault(cfg.discordBot.token, null),
                announceChannel: toDefault(cfg.discordBot.announceChannel, null),
                prefix: toDefault(cfg.discordBot.prefix, '/'),
                statusMessage: toDefault(
                    cfg.discordBot.statusMessage,
                    '**IP:** `change-me:<port>`\n**Players:** <players>\n**Uptime:** <uptime>',
                ),
                commandCooldown: toDefault(cfg.discordBot.commandCooldown, null), //not in template
            };
            out.fxRunner = {
                serverDataPath: toDefault(cfg.fxRunner.serverDataPath, null),
                cfgPath: toDefault(cfg.fxRunner.cfgPath, null),
                commandLine: toDefault(cfg.fxRunner.commandLine, null),
                logPath: toDefault(cfg.fxRunner.logPath, null), //not in template
                onesync: toDefault(cfg.fxRunner.onesync, null),
                autostart: toDefault(cfg.fxRunner.autostart, null),
                restartDelay: toDefault(cfg.fxRunner.restartDelay, null), //not in template
                quiet: toDefault(cfg.fxRunner.quiet, null),
            };

            //Migrations
            //Removing menu beta convar (v4.9)
            out.fxRunner.commandLine = out.fxRunner.commandLine?.replace(/\+?setr? txEnableMenuBeta true\s?/gi, '');

            //Merging portuguese
            if (out.global.language === 'pt_PT' || out.global.language === 'pt_BR'){
                out.global.language = 'pt';
            }
        } catch (error) {
            if (GlobalData.verbose) dir(error);
            throw new Error(`Malformed configuration file! Make sure your txAdmin is updated!\nOriginal error: ${error.message}`);
        }

        return out;
    }


    //================================================================
    /**
     * Setup the this.config variable based on the config file data
     * FIXME: rename this function
     * @param {object} cfgData
     */
    setupConfigDefaults(cfgData) {
        let cfg = cloneDeep(cfgData);
        //NOTE: the bool trick in fxRunner.autostart won't work if we want the default to be true
        try {
            //Global
            cfg.global.serverName = cfg.global.serverName || 'change-me';
            cfg.global.language = cfg.global.language || 'en'; //TODO: move to GlobalData
            cfg.global.menuEnabled = (cfg.global.menuEnabled === 'true' || cfg.global.menuEnabled === true);
            cfg.global.menuAlignRight = (cfg.global.menuAlignRight === 'true' || cfg.global.menuAlignRight === true);
            cfg.global.menuPageKey = cfg.global.menuPageKey || 'Tab';

            //Logger - NOTE: this one default's i'm doing directly into the class
            cfg.logger.fxserver = toDefault(cfg.logger.fxserver, {});
            cfg.logger.server = toDefault(cfg.logger.server, {});
            cfg.logger.admin = toDefault(cfg.logger.admin, {});
            cfg.logger.console = toDefault(cfg.logger.console, {});

            //Monitor
            cfg.monitor.restarterSchedule = cfg.monitor.restarterSchedule || [];
            cfg.monitor.restarterScheduleWarnings = cfg.monitor.restarterScheduleWarnings || [30, 15, 10, 5, 4, 3, 2, 1];
            cfg.monitor.cooldown = parseInt(cfg.monitor.cooldown) || 60; //not in template - 45 > 60 > 90 -> 60 after fixing the "extra time" logic
            cfg.monitor.disableChatWarnings = (cfg.monitor.disableChatWarnings === 'true' || cfg.monitor.disableChatWarnings === true);

            //Player Controller
            cfg.playerController.onJoinCheckBan = (cfg.playerController.onJoinCheckBan === null) ? true : (cfg.playerController.onJoinCheckBan === 'true' || cfg.playerController.onJoinCheckBan === true);
            cfg.playerController.onJoinCheckWhitelist = (cfg.playerController.onJoinCheckWhitelist === null) ? false : (cfg.playerController.onJoinCheckWhitelist === 'true' || cfg.playerController.onJoinCheckWhitelist === true);
            cfg.playerController.minSessionTime = parseInt(cfg.playerController.minSessionTime) || 15;
            cfg.playerController.whitelistRejectionMessage = cfg.playerController.whitelistRejectionMessage || 'You are not yet whitelisted in this server.\nPlease join http://discord.gg/example.\nYour Request ID: <id>';
            cfg.playerController.wipePendingWLOnStart = (cfg.playerController.wipePendingWLOnStart === null) ? true : (cfg.playerController.wipePendingWLOnStart === 'true' || cfg.playerController.wipePendingWLOnStart === true);

            //WebServer
            cfg.webServer.bufferTime = parseInt(cfg.webServer.bufferTime) || 1500; //not in template - deprecate?
            cfg.webServer.limiterMinutes = parseInt(cfg.webServer.limiterMinutes) || 15; //not in template
            cfg.webServer.limiterAttempts = parseInt(cfg.webServer.limiterAttempts) || 10; //not in template

            //DiscordBot
            cfg.discordBot.enabled = (cfg.discordBot.enabled === 'true' || cfg.discordBot.enabled === true);
            cfg.discordBot.prefix = cfg.discordBot.prefix || '/';
            cfg.discordBot.statusMessage = cfg.discordBot.statusMessage || '**Join:** `change-me:<port>`\n**Players:** <players>\n**Uptime:** <uptime>';
            cfg.discordBot.commandCooldown = parseInt(cfg.discordBot.commandCooldown) || 30; //not in template

            //FXRunner
            cfg.fxRunner.logPath = cfg.fxRunner.logPath || `${this.serverProfilePath}/logs/fxserver.log`; //not in template
            cfg.fxRunner.autostart = (cfg.fxRunner.autostart === 'true' || cfg.fxRunner.autostart === true);
            cfg.fxRunner.restartDelay = parseInt(cfg.fxRunner.restartDelay) || 1250; //not in templater
            cfg.fxRunner.quiet = (cfg.fxRunner.quiet === 'true' || cfg.fxRunner.quiet === true);
        } catch (error) {
            if (GlobalData.verbose) dir(error);
            throw new Error(`Malformed configuration file! Make sure your txAdmin is updated.\nOriginal error: ${error.message}`);
        }

        return cfg;
    }


    //================================================================
    /**
     * Create server profile folder structure if doesn't exist
     */
    setupFolderStructure() {
        try {
            let dataPath = `${this.serverProfilePath}/data/`;
            if (!fs.existsSync(dataPath)) {
                fs.mkdirSync(dataPath);
            }

            let logsPath = `${this.serverProfilePath}/logs/`;
            if (!fs.existsSync(logsPath)) {
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
    getScoped(scope) {
        return cloneDeep(this.config[scope]);
    }

    //================================================================
    /**
     * Return configs for a specific scope (reconstructed and freezed)
     */
    getScopedStructure(scope) {
        return cloneDeep(this.configFile[scope]);
    }


    //================================================================
    /**
     * Return all configs individually reconstructed and freezed
     */
    getAll() {
        let cfg = cloneDeep(this.config);
        return deepFreeze({
            global: cfg.global,
            logger: cfg.logger,
            monitor: cfg.monitor,
            playerController: cfg.playerController,
            webServer: cfg.webServer,
            discordBot: cfg.discordBot,
            fxRunner: cfg.fxRunner,
        });
    }


    //================================================================
    /**
     * Save the new scope to this context, then saves it to the configFile
     * @param {string} scope
     * @param {string} newConfig
     */
    saveProfile(scope, newConfig) {
        try {
            let toSave = cloneDeep(this.configFile);
            toSave[scope] = newConfig;
            toSave = removeNulls(toSave);
            fs.writeFileSync(this.configFilePath, JSON.stringify(toSave, null, 2), 'utf8');
            this.configFile = toSave;
            this.config = this.setupConfigDefaults(this.configFile);
            return true;
        } catch (error) {
            dir(error);
            return false;
        }
    }
}; //Fim ConfigVault()
