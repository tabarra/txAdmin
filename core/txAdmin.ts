import fs from 'node:fs';
import path from 'node:path';
import slash from 'slash';

import logger from '@core/extras/console';
import { txEnv } from '@core/globalData';

import { printBanner } from '@core/extras/banner';
import setupProfile from '@core/extras/setupProfile';
import updateChecker from '@core/extras/updateChecker';

import AdminVault from '@core/components/AdminVault';
import ConfigVault from '@core/components/ConfigVault';
import DiscordBot from '@core/components/DiscordBot';
import DynamicAds from '@core/components/DynamicAds';
import FxRunner from '@core/components/FxRunner';
import Logger from '@core/components/Logger';
import HealthMonitor from '@core/components/HealthMonitor';
import Scheduler from '@core/components/Scheduler';
import StatsCollector from '@core/components/StatsCollector';
import Translator from '@core/components/Translator';
import WebServer from '@core/components/WebServer';
import ResourcesManager from '@core/components/ResourcesManager';
import PlayerlistManager from '@core/components/PlayerlistManager';
import PlayerDatabase from '@core/components/PlayerDatabase';
import PersistentCache from '@core/components/PersistentCache';

const { dir, log, logOk, logWarn, logError } = logger(`v${txEnv.txAdminVersion}`);


//Helpers
const cleanPath = (x: string) => { return slash(path.normalize(x)); };


// Long ago I wanted to replace this with dependency injection.
// I Totally gave up.
const globalsInternal: Record<string, any> = {
    txAdmin: null, //self reference for webroutes that need to access it from the globals

    adminVault: null,
    discordBot: null,
    fxRunner: null,
    logger: null,
    dynamicAds: null,
    healthMonitor: null,
    scheduler: null,
    statsCollector: null,
    translator: null,
    webServer: null,
    resourcesManager: null,
    playerlistManager: null,
    playerDatabase: null,
    config: null,
    deployer: null,
    info: {},

    //FIXME: settings:save webroute cannot call txAdmin.refreshConfig for now
    //so this hack allows it to call it
    func_txAdminRefreshConfig: ()=>{},

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

//@ts-ignore: yes i know this is wrong
global.globals = globalsInternal;


/**
 * Main APP
 */
export default class TxAdmin {
    configVault;
    adminVault;
    discordBot;
    logger;
    translator;
    fxRunner;
    dynamicAds;
    healthMonitor;
    scheduler;
    statsCollector;
    webServer;
    resourcesManager;
    playerlistManager;
    playerDatabase;
    persistentCache;

    //Runtime
    readonly info: {
        serverProfile: string;
        serverProfilePath: string;
    }
    globalConfig: {
        serverName: string,
        language: string,
        menuEnabled: boolean,
        menuAlignRight: boolean,
        menuPageKey: string,
    }
    

    constructor(serverProfile: string) {
        log(`Profile '${serverProfile}' starting...`);

        //FIXME: hacky self reference because some webroutes need to access globals.txAdmin to pass it down
        globalsInternal.txAdmin = this;

        //Check if the profile exists and call setup if it doesn't
        const profilePath = cleanPath(path.join(txEnv.dataPath, serverProfile));
        if (!fs.existsSync(profilePath)) {
            try {
                setupProfile(txEnv.osType, txEnv.fxServerPath, txEnv.fxServerVersion, serverProfile, profilePath);
            } catch (error) {
                logError(`Failed to create profile '${serverProfile}' with error: ${(error as Error).message}`);
                process.exit();
            }
        }
        this.info = {
            serverProfile: serverProfile,
            serverProfilePath: profilePath
        }
        globalsInternal.info = this.info;

        //Load Config Vault
        let profileConfig;
        try {
            this.configVault = new ConfigVault(profilePath, serverProfile);
            globalsInternal.configVault = this.configVault;
            profileConfig = globalsInternal.configVault.getAll();
            this.globalConfig = profileConfig.global;
            globalsInternal.config = this.globalConfig;

            //FIXME: hacky fix for settings:save to be able to update this
            globalsInternal.func_txAdminRefreshConfig = this.refreshConfig.bind(this);
        } catch (error) {
            logError(`Error starting ConfigVault: ${(error as Error).message}`);
            dir(error);
            process.exit(1);
        }

        //Start all modules
        //NOTE: dependency order
        //  - translator before fxrunner (for the locale string)
        //  - translator before scheduler (in case it tries to send translated msg immediately)
        //  - adminVault before webserver
        //  - logger before fxrunner
        //FIXME: After the migration, delete the globalsInternal.
        try {
            this.adminVault = new AdminVault();
            globalsInternal.adminVault = this.adminVault;

            this.discordBot = new DiscordBot(this, profileConfig.discordBot);
            globalsInternal.discordBot = this.discordBot;

            this.logger = new Logger(profileConfig.logger);
            globalsInternal.logger = this.logger;

            this.translator = new Translator();
            globalsInternal.translator = this.translator;

            this.fxRunner = new FxRunner(this, profileConfig.fxRunner);
            globalsInternal.fxRunner = this.fxRunner;

            this.dynamicAds = new DynamicAds();
            globalsInternal.dynamicAds = this.dynamicAds;

            this.healthMonitor = new HealthMonitor(profileConfig.monitor);
            globalsInternal.healthMonitor = this.healthMonitor;

            this.scheduler = new Scheduler(profileConfig.monitor); //NOTE same opts as monitor, for now
            globalsInternal.scheduler = this.scheduler;

            this.statsCollector = new StatsCollector();
            globalsInternal.statsCollector = this.statsCollector;

            this.webServer = new WebServer(profileConfig.webServer);
            globalsInternal.webServer = this.webServer;

            this.resourcesManager = new ResourcesManager();
            globalsInternal.resourcesManager = this.resourcesManager;

            this.playerlistManager = new PlayerlistManager(this);
            globalsInternal.playerlistManager = this.playerlistManager;

            this.playerDatabase = new PlayerDatabase(this, profileConfig.playerDatabase);
            globalsInternal.playerDatabase = this.playerDatabase;

            this.persistentCache = new PersistentCache(this);
            globalsInternal.persistentCache = this.persistentCache;
        } catch (error) {
            logError(`Error starting main components: ${(error as Error).message}`);
            dir(error);
            process.exit(1);
        }

        //Once they all finish loading, the function below will print the banner
        printBanner();

        //Run Update Checker every 15 minutes
        updateChecker();
        setInterval(updateChecker, 15 * 60 * 1000);
    }

    /**
     * Refreshes the global config
     */
    refreshConfig() {
        this.globalConfig = this.configVault.getScoped('global');
        globalsInternal.config = this.globalConfig;
    }
};
