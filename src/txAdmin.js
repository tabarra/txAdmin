//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('./extras/console');


/**
 * Main APP
 */
module.exports = class txAdmin {
    constructor(serverProfile){
        log(">>Starting txAdmin");

        //Get current version
        try {
            let versioData = require('../version.json');
            if(!versioData || typeof versioData.version !== 'string') throw new Error('Invalid data in the version file.');
            globals.version.current = versioData.version;
        } catch (error) {
            logError(`Error reading or parsing the 'version.json' file:`);
            logError(error.message);
            process.exit();
        }

        //Load Config Vault
        let profileConfig;
        try {
            const ConfigVault = require('./components/configVault')
            globals.configVault = new ConfigVault(serverProfile);
            profileConfig = globals.configVault.getAll();
            globals.config = profileConfig.global;
        } catch (err) {
            HandleFatalError(err, 'ConfigVault');
        }

        //Start all modules
        this.startAuthenticator(profileConfig.authenticator).catch((err) => {
            HandleFatalError(err, 'Authenticator');
        });
        this.startDiscordBot(profileConfig.discordBot).catch((err) => {
            HandleFatalError(err, 'DiscordBot');
        });
        this.startFXServer(profileConfig.fxRunner).catch((err) => {
            HandleFatalError(err, 'FXServer');
        });
        this.startLogger(profileConfig.logger).catch((err) => {
            HandleFatalError(err, 'Logger');
        });
        this.startMonitor(profileConfig.monitor).catch((err) => {
            HandleFatalError(err, 'Monitor');
        });
        this.startWebServer(profileConfig.webServer).catch((err) => {
            HandleFatalError(err, 'WebServer');
        });
        this.startWebConsole(profileConfig.webConsole).catch((err) => {
            HandleFatalError(err, 'WebConsole');
        });

        //Run Update Checker every 30 minutes
        const updateChecker = require('./extras/updateChecker');
        updateChecker();
        setInterval(updateChecker, 30 * 60 * 1000);
    }

    //==============================================================
    async startAuthenticator(config){
        const Monitor = require('./components/authenticator')
        globals.authenticator = new Monitor(config);
    }

    //==============================================================
    async startDiscordBot(config){
        const DiscordBot = require('./components/discordBot')
        globals.discordBot = new DiscordBot(config);
    }

    //==============================================================
    async startFXServer(config){
        const FXRunner = require('./components/fxRunner')
        globals.fxRunner = new FXRunner(config);
    }

    //==============================================================
    async startLogger(config){
        const Logger = require('./components/logger')
        globals.logger = new Logger(config);
    }

    //==============================================================
    async startMonitor(config){
        const Authenticator = require('./components/monitor')
        globals.monitor = new Authenticator(config);
    }

    //==============================================================
    async startWebServer(config){
        const WebServer = require('./components/webServer')
        globals.webServer = new WebServer(config);
    }

    //==============================================================
    async startWebConsole(config){
        const WebConsole = require('./components/webConsole')
        globals.webConsole = new WebConsole(config);
    }
}


//==============================================================
function HandleFatalError(err, context){
    if(err.message.includes('Cannot find module')){
        logError(`Error starting '${context}' module. Make sure you executed 'npm install'.`)
        if(globals.config.verbose) dir(error);
    }else{
        logError(`Error starting '${context}' module: ${err.message}`)
        logError(err.stack, context)
    }

    process.exit();
}
