//Requires
const fs = require('fs');
const path = require('path');
const slash = require('slash');
const { dir, log, logOk, logWarn, logError} = require('./extras/console')();

//Helpers
const cleanPath = (x) => { return slash(path.normalize(x)) };


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
    info: {},

    //FIXME: remove with the Extensions update
    intercomTempLog: [],
    intercomTempResList: null,
}


/**
 * Main APP
 */
module.exports = class txAdmin {
    constructor(serverProfile){
        //FIXME: dataPath, profilePath, serverProfile, txAdminPort
        log(`>> Starting profile ${serverProfile}`);
        globals.info.serverProfile =  serverProfile;

        //Check if the profile exists and call setup if it doesn't
        const profilePath = cleanPath(path.join(GlobalData.dataPath, serverProfile));
        if(!fs.existsSync(profilePath)){
            try {
                const SetupProfile = require('./extras/setupProfile.js');
                SetupProfile(GlobalData.osType, GlobalData.fxServerPath, GlobalData.fxServerVersion, serverProfile, profilePath);
            } catch (error) {
                logError(`Failed to create profile '${serverProfile}' with error: ${error.message}`);
                process.exit();
            }
        }
        globals.info.serverProfilePath = profilePath;

        //Load Config Vault
        let profileConfig;
        try {
            const ConfigVault = require('./components/configVault');
            globals.configVault = new ConfigVault(profilePath, serverProfile);
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
        // this.startDatabase().catch((err) => {
        //     HandleFatalError(err, 'Database');
        // });

        //NOTE: dependency order
        //  - translator before monitor
        //  - authenticator before webserver

        //Run Update Checker every 15 minutes
        // const updateChecker = require('./extras/updateChecker');
        // updateChecker();
        // setInterval(updateChecker, 15 * 60 * 1000);
    }


    //==============================================================
    async startAuthenticator(config){
        const Authenticator = require('./components/authenticator')
        globals.authenticator = new Authenticator(config);
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
    //FIXME: experimental database
    async startDatabase(){
        const Database = require('./components/database')
        globals.database = new Database();
    }
}


//==============================================================
function HandleFatalError(err, componentName){
    if(err.message.includes('Cannot find module') && process.env.APP_ENV !== 'webpack'){
        logError(`Error starting '${componentName}' module. Make sure you executed 'npm install'.`)
        if(globals.config.verbose) dir(err);
    }else{
        logError(`Error starting '${componentName}' module: ${err.message}`)
        dir(err)
    }

    process.exit();
}
