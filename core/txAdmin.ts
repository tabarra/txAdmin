import { txEnv } from '@core/globalData';
import { printBanner } from './boot/banner';

import AdminVault from '@modules/AdminVault';
import ConfigVault from '@modules/ConfigVault';
import DiscordBot from '@modules/DiscordBot';
import DynamicAds from '@modules/DynamicAds';
import FxRunner from '@modules/FxRunner';
import Logger from '@modules/Logger';
import HealthMonitor from '@modules/HealthMonitor';
import Scheduler from '@modules/Scheduler';
import StatsManager from '@modules/StatsManager';
import Translator from '@modules/Translator';
import WebServer from '@modules/WebServer';
import ResourcesManager from '@modules/ResourcesManager';
import PlayerlistManager from '@modules/PlayerlistManager';
import PlayerDatabase from '@modules/PlayerDatabase';
import PersistentCache from '@modules/PersistentCache';
import CfxUpdateChecker from '@modules/CfxUpdateChecker';

import consoleFactory from '@lib/console';
import { getHostData } from '@lib/diagnostics';
import fatalError from '@lib/fatalError';
const console = consoleFactory();


// FIXME: replace with GlobalPlaceholder
const globalsInternal: Record<string, any> = {
    txAdmin: null, //self reference for webroutes that need to access it from the globals

    adminVault: null,
    discordBot: null,
    fxRunner: null,
    logger: null,
    dynamicAds: null,
    healthMonitor: null,
    scheduler: null,
    statsManager: null,
    translator: null,
    webServer: null,
    resourcesManager: null,
    playerlistManager: null,
    playerDatabase: null,
    deployer: null,
    cfxUpdateChecker: null,
    info: {},

    //FIXME: settings:save webroute cannot call txAdmin.refreshConfig for now
    //so this hack allows it to call it
    func_txAdminRefreshConfig: () => { },
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
    statsManager;
    webServer;
    resourcesManager;
    playerlistManager;
    playerDatabase;
    persistentCache;
    cfxUpdateChecker;

    //Runtime
    globalConfig: {
        serverName: string,
        language: string,
        menuEnabled: boolean,
        menuAlignRight: boolean,
        menuPageKey: string,

        hideDefaultAnnouncement: boolean,
        hideDefaultDirectMessage: boolean,
        hideDefaultWarning: boolean,
        hideDefaultScheduledRestartWarning: boolean,
        hideAdminInPunishments: boolean,
        hideAdminInMessages: boolean,
    }


    constructor() {
        console.log(`Starting profile '${txEnv.profile}' on v${txEnv.txaVersion}/b${txEnv.fxsVersionDisplay}`);

        //FIXME: hacky self reference because some webroutes need to access globals.txAdmin to pass it down
        globalsInternal.txAdmin = this;

        //Load Config Vault
        let profileConfig;
        try {
            this.configVault = new ConfigVault(txEnv.profilePath, txEnv.profile);
            globalsInternal.configVault = this.configVault;
            profileConfig = globalsInternal.configVault.getAll();
            this.globalConfig = profileConfig.global;

            //FIXME: hacky fix for settings:save to be able to update this
            globalsInternal.func_txAdminRefreshConfig = this.refreshConfig.bind(this);
        } catch (error) {
            fatalError.Boot(20, 'Failed to start ConfigVault', error);
        }

        //Start all modules
        //NOTE: dependency order
        //  - translator before fxrunner (for the locale string)
        //  - translator before scheduler (in case it tries to send translated msg immediately)
        //  - adminVault before webserver
        //  - logger before fxrunner
        //FIXME: After the migration, delete the globalsInternal.

        //FIXME: group the modules into two groups, one is the "core stuff" (server running, web open, banner, database, etc)
        //FIXME: and the other group can start on the next tick
        try {
            this.adminVault = new AdminVault();
            globalsInternal.adminVault = this.adminVault;

            this.discordBot = new DiscordBot(this, profileConfig.discordBot);
            globalsInternal.discordBot = this.discordBot;

            this.logger = new Logger(this, profileConfig.logger);
            globalsInternal.logger = this.logger;

            this.translator = new Translator(this);
            globalsInternal.translator = this.translator;

            this.fxRunner = new FxRunner(this, profileConfig.fxRunner);
            globalsInternal.fxRunner = this.fxRunner;

            this.dynamicAds = new DynamicAds();
            globalsInternal.dynamicAds = this.dynamicAds;

            this.healthMonitor = new HealthMonitor(profileConfig.monitor);
            globalsInternal.healthMonitor = this.healthMonitor;

            this.scheduler = new Scheduler(profileConfig.monitor); //NOTE same opts as monitor, for now
            globalsInternal.scheduler = this.scheduler;

            this.statsManager = new StatsManager(this);
            globalsInternal.statsManager = this.statsManager;

            this.webServer = new WebServer(this, profileConfig.webServer);
            globalsInternal.webServer = this.webServer;

            this.resourcesManager = new ResourcesManager();
            globalsInternal.resourcesManager = this.resourcesManager;

            this.playerlistManager = new PlayerlistManager(this);
            globalsInternal.playerlistManager = this.playerlistManager;

            this.playerDatabase = new PlayerDatabase(this, profileConfig.playerDatabase);
            globalsInternal.playerDatabase = this.playerDatabase;

            this.persistentCache = new PersistentCache(this);
            globalsInternal.persistentCache = this.persistentCache;

            this.cfxUpdateChecker = new CfxUpdateChecker(this);
            globalsInternal.cfxUpdateChecker = this.cfxUpdateChecker;
        } catch (error) {
            fatalError.Boot(21, 'Failed to start modules', error);
        }

        //Once they all finish loading, the function below will print the banner
        try {
            printBanner();
        } catch (error) {
            console.dir(error);
        }

        //Pre-calculate static data
        setTimeout(() => {
            getHostData(this).catch((e) => { });
        }, 10_000);
    }

    /**
     * Refreshes the global config
     */
    refreshConfig() {
        this.globalConfig = this.configVault.getScoped('global');
    }
};
