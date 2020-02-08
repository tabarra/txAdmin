//Requires
const { dir, log, logOk, logWarn, logError} = require('./extras/console')();

//FIXME: I should be using dependency injection or something
globals = {
    authenticator: null,
    discordBot: null,
    fxRunner: null,
    logger: null,
    monitor: null,
    translator: null,
    webConsole: null,
    webServer: null,
    database: null,
    config: null,
    version: {
        current: '--',
        latest: '--',
        changelog: '--',
        allVersions: []
    },
    dashboardErrorMessage: null,
    //FIXME: remove with the Extensions update
    intercomTempLog: [],
    intercomTempResList: null,
}


/**
 * Main APP
 */
module.exports = class txAdmin {
    //NOTE: after adding support for multi-server, review parameter cascading
    constructor(dataPath, profilePath, serverProfile, txAdminPort){
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
            globals.configVault = new ConfigVault(profilePath, serverProfile);
            profileConfig = globals.configVault.getAll();
            globals.config = profileConfig.global;
        } catch (err) {
            HandleFatalError(err, 'ConfigVault');
        }

        //Start all modules
        this.startAuthenticator(profileConfig.authenticator, dataPath).catch((err) => { //NOTE: temp parameter
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
        this.startWebServer(profileConfig.webServer, txAdminPort).catch((err) => { //NOTE: temp parameter
            HandleFatalError(err, 'WebServer');
        });
        this.startWebConsole(profileConfig.webConsole).catch((err) => {
            HandleFatalError(err, 'WebConsole');
        });
        // this.startDatabase().catch((err) => {
        //     HandleFatalError(err, 'Database');
        // });

        //FIXME: dependency order
        //  - translator before monitor
        //  - webserver before webconsole

        //Run Update Checker every 15 minutes
        const updateChecker = require('./extras/updateChecker');
        // updateChecker();
        setInterval(updateChecker, 15 * 60 * 1000);
    }


    //==============================================================
    async startAuthenticator(config, dataPath){
        const Authenticator = require('./components/authenticator')
        globals.authenticator = new Authenticator(config, dataPath);
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
    async startWebServer(config, txAdminPort){
        const WebServer = require('./components/webServer')
        globals.webServer = new WebServer(config, txAdminPort);
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
function HandleFatalError(err, componentName){
    if(err.message.includes('Cannot find module')){
        logError(`Error starting '${componentName}' module. Make sure you executed 'npm install'.`)
        if(globals.config.verbose) dir(err);
    }else{
        logError(`Error starting '${componentName}' module: ${err.message}`)
        dir(err)
    }

    process.exit();
}
