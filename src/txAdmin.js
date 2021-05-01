//Requires
const fs = require('fs');
const path = require('path');
const slash = require('slash');
const { dir, log, logOk, logWarn, logError } = require('./extras/console')(`v${GlobalData.txAdminVersion}`);
const { printBanner } = require('./extras/banner');

//Helpers
const cleanPath = (x) => { return slash(path.normalize(x)); };


//FIXME: I should be using dependency injection or something
globals = {
    authenticator: null,
    discordBot: null,
    fxRunner: null,
    logger: null,
    dynamicAds: null,
    monitor: null,
    statsCollector: null,
    translator: null,
    webServer: null,
    playerController: null,
    config: null,
    deployer: null,
    info: {},

    //NOTE: still not ideal, but since the extensions system changed entirely,
    //      will have to rethink the plans for this variable.
    databus: {
        //internal
        resourcesList: null,
        serverLog: [],
        updateChecker: null,
        joinCheckHistory: [],

        //stats
        txStatsData: {
            playerDBStats: null,
            lastFD3Error: '',
            heartBeatStats: {
                httpFailed: 0,
                fd3Failed: 0,
            },
            bootSeconds: [],
            freezeSeconds: [],
            pageViews: {},
            httpCounter: {
                current: 0,
                max: 0,
                log: [],
            },
            loginOrigins: {
                localhost: 0,
                cfxre: 0,
                ip: 0,
                other: 0,
            },
            loginMethods: {
                discord: 0,
                citizenfx: 0,
                password: 0,
                zap: 0,
            },
        },
    },
};


/**
 * Main APP
 */
module.exports = class txAdmin {
    constructor(serverProfile) {
        log(`Profile '${serverProfile}' starting...`);
        globals.info.serverProfile = serverProfile;

        //Check if the profile exists and call setup if it doesn't
        const profilePath = cleanPath(path.join(GlobalData.dataPath, serverProfile));
        if (!fs.existsSync(profilePath)) {
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
        this.startTranslator().catch((err) => {
            HandleFatalError(err, 'Translator');
        });
        this.startFXRunner(profileConfig.fxRunner).catch((err) => {
            HandleFatalError(err, 'FXRunner');
        });
        this.startLogger(profileConfig.logger).catch((err) => {
            HandleFatalError(err, 'Logger');
        });
        this.startDynamicAds().catch((err) => {
            HandleFatalError(err, 'DynamicAds');
        });
        this.startMonitor(profileConfig.monitor).catch((err) => {
            HandleFatalError(err, 'Monitor');
        });
        this.startStatsCollector(profileConfig.statsCollector).catch((err) => {
            HandleFatalError(err, 'StatsCollector');
        });
        this.startWebServer(profileConfig.webServer).catch((err) => {
            HandleFatalError(err, 'WebServer');
        });
        this.startPlayerController(profileConfig.playerController).catch((err) => {
            HandleFatalError(err, 'PlayerController');
        });

        //Once they all finish loading, the function below will print the banner
        printBanner();

        //NOTE: dependency order
        //  - translator before monitor
        //  - translator before fxrunner (for the locale string)
        //  - authenticator before webserver

        //Run Update Checker every 15 minutes
        const updateChecker = require('./extras/updateChecker');
        updateChecker();
        setInterval(updateChecker, 15 * 60 * 1000);
    }


    //==============================================================
    async startAuthenticator(config) {
        const Authenticator = require('./components/authenticator');
        globals.authenticator = new Authenticator(config);
    }

    //==============================================================
    async startDiscordBot(config) {
        const DiscordBot = require('./components/discordBot');
        globals.discordBot = new DiscordBot(config);
    }

    //==============================================================
    async startFXRunner(config) {
        const FXRunner = require('./components/fxRunner');
        globals.fxRunner = new FXRunner(config);
    }

    //==============================================================
    async startLogger(config) {
        const Logger = require('./components/logger');
        globals.logger = new Logger(config);
    }

    //==============================================================
    async startDynamicAds(config) {
        const DynamicAds = require('./components/dynamicAds');
        globals.dynamicAds = new DynamicAds(config);
    }

    //==============================================================
    async startMonitor(config) {
        const Monitor = require('./components/monitor');
        globals.monitor = new Monitor(config);
    }

    //==============================================================
    async startStatsCollector(config) {
        const StatsCollector = require('./components/statsCollector');
        globals.statsCollector = new StatsCollector(config);
    }

    //==============================================================
    async startTranslator() {
        const Translator = require('./components/translator');
        globals.translator = new Translator();
    }

    //==============================================================
    async startWebServer(config) {
        const WebServer = require('./components/webServer');
        globals.webServer = new WebServer(config);
    }

    //==============================================================
    //NOTE: this component name might change
    async startPlayerController(config) {
        const PlayerController = require('./components/playerController');
        globals.playerController = new PlayerController(config);
    }
};


//==============================================================
function HandleFatalError(error, componentName) {
    if (error.message.includes('Cannot find module') && process.env.APP_ENV !== 'webpack') {
        logError(`Error starting '${componentName}' module. Make sure you executed 'npm install'.`);
        if (GlobalData.verbose) dir(error);
    } else {
        logError(`Error starting '${componentName}' module: ${error.message}`);
        dir(error);
    }

    process.exit();
}
