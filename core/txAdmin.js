import fs from 'node:fs';
import path from 'node:path';
import slash from 'slash';

import logger from '@core/extras/console';
import { txEnv } from '@core/globalData.js';

import { printBanner } from '@core/extras/banner';
// import setupProfile from '@core/extras/setupProfile';
// import updateChecker from '@core/extras/updateChecker';

// import AdminVault from '@core/components/adminVault';
// import ConfigVault from '@core/components/configVault';
// import DiscordBot from '@core/components/discordBot';
// import DynamicAds from '@core/components/dynamicAds';
// import FxRunner from '@core/components/fxRunner';
// import Logger from '@core/components/logger';
// import Monitor from '@core/components/monitor';
// import PlayerController from '@core/components/playerController';
// import ResourcesManager from '@core/components/resourcesManager';
// import StatsCollector from '@core/components/statsCollector';
// import Translator from '@core/components/translator';
// import WebServer from '@core/components/webServer';

const { dir, log, logOk, logWarn, logError } = logger(`v${txEnv.txAdminVersion}`);


//Helpers
const cleanPath = (x) => { return slash(path.normalize(x)); };


// Long ago I wanted to replace this with dependency injection.
// I Totally gave up.
global.globals = {
    adminVault: null,
    discordBot: null,
    fxRunner: null,
    logger: null,
    dynamicAds: null,
    monitor: null,
    statsCollector: null,
    translator: null,
    webServer: null,
    playerController: null,
    resourcesManager: null,
    config: null,
    deployer: null,
    info: {},

    //NOTE: still not ideal, but since the extensions system changed entirely,
    //      will have to rethink the plans for this variable.
    databus: {
        //internal
        resourcesList: null,
        updateChecker: null,
        joinCheckHistory: [],

        //stats
        txStatsData: {
            playerDBStats: null,
            lastFD3Error: '',
            monitorStats: {
                heartBeatStats: {
                    httpFailed: 0,
                    fd3Failed: 0,
                },
                restartReasons: {
                    close: 0,
                    heartBeat: 0,
                    healthCheck: 0,
                },
                bootSeconds: [],
                freezeSeconds: [],
            },
            randIDFailures: 0,
            pageViews: {},
            httpCounter: {
                current: 0,
                max: 0,
                log: [],
            },
            login: {
                origins: {
                    localhost: 0,
                    cfxre: 0,
                    ip: 0,
                    other: 0,
                    webpipe: 0,
                },
                methods: {
                    discord: 0,
                    citizenfx: 0,
                    password: 0,
                    zap: 0,
                    nui: 0,
                    iframe: 0,
                },
            },
        },
    },
};


/**
 * Main APP
 */
export default class TxAdmin {
    constructor(serverProfile) {
        log(`Profile '${serverProfile}' starting...`);
        globals.info.serverProfile = serverProfile;
        return false; //DEBUG

        //Check if the profile exists and call setup if it doesn't
        const profilePath = cleanPath(path.join(GlobalData.dataPath, serverProfile));
        if (!fs.existsSync(profilePath)) {
            try {
                setupProfile(GlobalData.osType, GlobalData.fxServerPath, GlobalData.fxServerVersion, serverProfile, profilePath);
            } catch (error) {
                logError(`Failed to create profile '${serverProfile}' with error: ${error.message}`);
                process.exit();
            }
        }
        globals.info.serverProfilePath = profilePath;

        return false; //DEBUG

        //Load Config Vault
        let profileConfig;
        try {
            globals.configVault = new ConfigVault(profilePath, serverProfile);
            profileConfig = globals.configVault.getAll();
            globals.config = profileConfig.global;
        } catch (err) {
            HandleFatalError(err, 'ConfigVault');
        }

        //Start all modules
        //NOTE: dependency order
        //  - translator before monitor
        //  - adminVault before webserver
        //  - logger before fxrunner
        //  - translator before fxrunner (for the locale string)
        //  - adminVault before webserver
        try {
            globals.adminVault = new AdminVault();
            globals.discordBot = new DiscordBot(config.discordBot);
            globals.logger = new Logger(config.logger);
            globals.translator = new Translator();
            globals.fxRunner = new FxRunner(config.fxRunner);
            globals.dynamicAds = new DynamicAds(config.dynamicAds);
            globals.monitor = new Monitor(config.monitor);
            globals.statsCollector = new StatsCollector(config.statsCollector);
            globals.webServer = new WebServer(config.webServer);
            globals.playerController = new PlayerController(config.playerController);
            globals.resourcesManager = new ResourcesManager(config.resourcesManager);
        } catch (err) {
            HandleFatalError(err, 'Main Components');
        }

        //Once they all finish loading, the function below will print the banner
        printBanner();

        //Run Update Checker every 15 minutes
        updateChecker();
        setInterval(updateChecker, 15 * 60 * 1000);
    }
};


//==============================================================
function HandleFatalError(error, componentName) {
    logError(`Error starting component '${componentName}': ${error.message}`);
    dir(error);
    process.exit(1);
}
