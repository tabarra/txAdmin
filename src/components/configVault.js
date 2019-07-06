//Requires
const os = require('os');
const fs = require('fs');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'ConfigVault';


module.exports = class ConfigVault {
    constructor(serverProfile) {
        this.serverProfile = serverProfile;
        this.serverProfilePath = `data/${serverProfile}`;
        this.configFilePath = `${this.serverProfilePath}/config.json`;
        this.config = null;
        
        this.setupConfig();
        logOk('::Started', context);
    }


    //================================================================
    /**
     * Setup the this.config variable based on the config file data
     */
    setupConfig(){
        let cfgData = this.getConfigFromFile();
        this.setupFolderStructure();

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

        //NOTE: the bool trick in global.verbose and fxRunner.autostart won't work if we want the default to be true
        //NOTE: Some settings here were removed from the config template file to look less intimidating. Put them in the docs ASAP.
        try {
            out.global = {
                verbose: (cfgData.global.verbose === 'true' || cfgData.global.verbose === true),
                publicIP: cfgData.global.publicIP || "change-me",
                serverName: cfgData.global.serverName || "change-me",
                fxServerPort: toDefault(parseInt(cfgData.global.fxServerPort), null),
                
                //Extras
                osType: os.type() || 'unknown',
                serverProfile: this.serverProfile,
                serverProfilePath: this.serverProfilePath
            };
            out.logger = {
                logPath: cfgData.logger.logPath || `${this.serverProfilePath}/logs/admin.log`, //not in template 
            };
            out.monitor = {
                interval: parseInt(cfgData.monitor.interval) || 1000, //not in template
                timeout: parseInt(cfgData.monitor.timeout) || 1000,
                restarter: {
                    cooldown: parseInt(cfgData.monitor.restarter.cooldown) || 120, //not in template
                    failures: parseInt(cfgData.monitor.restarter.failures) || 15,
                    schedule: cfgData.monitor.restarter.schedule || []
                }
            };
            out.authenticator = {
                refreshInterval: parseInt(cfgData.authenticator.refreshInterval) || 15000, //not in template
            };
            out.webServer = {
                port: parseInt(cfgData.webServer.port) || 40120,
                bufferTime: parseInt(cfgData.webServer.bufferTime) || 1500, //not in template - deprecate?
                limiterMinutes: parseInt(cfgData.webServer.limiterMinutes) || 15, //not in template
                limiterAttempts: parseInt(cfgData.webServer.limiterAttempts) || 5, //not in template
            };
            out.webConsole = {
                //nothing to configure
            };
            out.discordBot = {
                enabled: (cfgData.discordBot.enabled === 'true' || cfgData.discordBot.enabled === true),
                token:  cfgData.discordBot.token || ((cfgData.discordBot.enabled === 'true' || cfgData.discordBot.enabled === true) && fatalRequired('discordBot.token')),
                messagesFilePath: cfgData.discordBot.messagesFilePath || `${this.serverProfilePath}/messages.json`, //not in template
                refreshInterval: parseInt(cfgData.discordBot.refreshInterval) || 15000, //not in template
                statusCommand: cfgData.discordBot.statusCommand || "/status",
            };
            out.fxRunner = {
                buildPath: toDefault(cfgData.fxRunner.buildPath, null),
                basePath: toDefault(cfgData.fxRunner.basePath, null),
                cfgPath: toDefault(cfgData.fxRunner.cfgPath, null),
                setPriority: cfgData.fxRunner.setPriority || "NORMAL",
                onesync: (cfgData.fxRunner.onesync === 'true' || cfgData.fxRunner.onesync === true),
                autostart: (cfgData.fxRunner.autostart === 'true' || cfgData.fxRunner.autostart === true),
                autostartDelay: parseInt(cfgData.webServer.autostartDelay) || 3, //not in template
                quiet: (cfgData.fxRunner.quiet === 'true' || cfgData.fxRunner.quiet === true),
            };
        } catch (error) {
            logError('Malformed configuration file! Please copy server-template.json and try again.', context);
            dir(error);
            process.exit(0);
        }

        this.config = out;
    }


    //================================================================
    /**
     * Returns the config file data
     * @param {string} xxxx 
     */
    getConfigFromFile(){
        //Try to load config file
        //TODO: create a lock file to prevent starting twice the same config file?
        let rawFile = null;
        try {
            rawFile = fs.readFileSync(this.configFilePath, 'utf8');
        } catch (error) {
            logError(`Unnable to load configuration file '${this.configFilePath}'. (cannot read file, please read the documentation)`, context);
            process.exit(0)
        }

        //Try to parse config file
        let cfgData = null;
        try {
            cfgData = JSON.parse(rawFile);
        } catch (error) {
            logError(`Unnable to load configuration file '${this.configFilePath}'. (json parse error, please read the documentation)`, context);
            if(rawFile.includes('\\')) logError(`Note: your '${this.serverProfile}.json' file contains '\\', make sure all your paths use only '/'.`, context)
            process.exit();
        }

        return cfgData;
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
        return {...this.config[scope]};
    }


    //================================================================
    /**
     * Return all configs individually reconstructed and freezed
     */
    getAll(){
        return {
            global: Object.freeze({...this.config.global}),
            logger: Object.freeze({...this.config.logger}),
            monitor: Object.freeze({...this.config.monitor}),
            authenticator: Object.freeze({...this.config.authenticator}),
            webServer: Object.freeze({...this.config.webServer}),
            webConsole: Object.freeze({...this.config.webConsole}),
            discordBot: Object.freeze({...this.config.discordBot}),
            fxRunner: Object.freeze({...this.config.fxRunner}),
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
            this.config[scope] = newConfig;
            let toSave = {...this.config};
            delete toSave.global.osType;
            delete toSave.global.serverProfile;
            delete toSave.global.serverProfilePath;
            fs.writeFileSync(this.configFilePath, JSON.stringify(toSave, null, 2), 'utf8');
            return true;
        } catch (error) {
            dir(error)
            return false;
        }
    }


} //Fim ConfigVault()


//================================================================
//Helper Functions
function fatalRequired(varName){
    logError(`The following configuration was not set and is required: '${varName}'`, context);
    process.exit();
}
function toDefault(input, defValue){
    return (typeof input === 'undefined')? defValue : input;
}
