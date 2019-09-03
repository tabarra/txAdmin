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
        this.startFXRunner(profileConfig.fxRunner).catch((err) => {
            HandleFatalError(err, 'FXRunner');
        });
        this.startLogger(profileConfig.logger).catch((err) => {
            HandleFatalError(err, 'Logger');
        });
        this.startTranslator().catch((err) => {
            HandleFatalError(err, 'Translator');
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
        //FIXME: dependency order
        //  - translator before monitor
        //  - webserver before webconsole

        this.startDatabase().catch((err) => {
            HandleFatalError(err, 'Database');
        });

        //Run Update Checker every 15 minutes
        const updateChecker = require('./extras/updateChecker');
        updateChecker();
        setInterval(updateChecker, 15 * 60 * 1000);
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
    async startFXRunner(config){
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
    async startTranslator(){
        const Translator = require('./components/translator')
        globals.translator = new Translator();
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

    //==============================================================
    //FIXME: experimental database
    async startDatabase(){
        const Database = require('./components/database')
        globals.database = new Database();
    }
}


//==============================================================
function HandleFatalError(err, context){
    if(err.message.includes('Cannot find module')){
        logError(`Error starting '${context}' module. Make sure you executed 'npm install'.`)
        if(globals.config.verbose) dir(err);
    }else{
        logError(`Error starting '${context}' module: ${err.message}`)
        logError(err.stack, context)
    }

    process.exit();
}
