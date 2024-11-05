import consoleFactory from '@lib/console';
import fatalError from '@lib/fatalError';
import { getCoreProxy } from './boot/globalPlaceholder';

import TxManager from './txManager';
import ConfigVault from '@modules/ConfigVault';
import AdminVault from '@modules/AdminVault';
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
const console = consoleFactory();


export type TxCoreType = {
    configVault: ConfigVault;
    adminVault: AdminVault;
    discordBot: DiscordBot;
    logger: Logger;
    translator: Translator;
    fxRunner: FxRunner;
    dynamicAds: DynamicAds;
    healthMonitor: HealthMonitor;
    scheduler: Scheduler;
    statsManager: StatsManager;
    webServer: WebServer;
    resourcesManager: ResourcesManager;
    playerlistManager: PlayerlistManager;
    playerDatabase: PlayerDatabase;
    persistentCache: PersistentCache;
    cfxUpdateChecker: CfxUpdateChecker;
}

// FIXME: figure out how to deal with the banner
// talvez isso seja responsabilidade do txManager?


export default function bootTxAdmin() {
    /**
     * MARK: Setting up Globals
     */
    //Initialize the global txCore object
    const _txCore = {
        configVault: new ConfigVault(),
    } as TxCoreType;

    //Setting up the global txCore object as a Proxy
    (globalThis as any).txCore = getCoreProxy(_txCore);

    //Setting up & Validating txConfig
    if (!txConfig || typeof txConfig !== 'object' || txConfig === null) {
        throw new Error('txConfig is not defined');
    }

    //Initialize the txManager
    (globalThis as any).txManager = new TxManager();


    /**
     * MARK: Booting Modules
     */
    //Helper function to start the modules
    const startModule = <T>(Class: GenericTxModule<T>, prop: keyof TxCoreType): T => {
        const instance = new Class();
        //TODO: add config keys registration
        return instance;
    };

    //High Priority (required for banner) 
    _txCore.adminVault = startModule(AdminVault, 'adminVault');
    _txCore.webServer = startModule(WebServer, 'webServer');
    _txCore.playerDatabase = startModule(PlayerDatabase, 'playerDatabase');

    //Required for signalStartReady()
    _txCore.healthMonitor = startModule(HealthMonitor, 'healthMonitor');
    _txCore.discordBot = startModule(DiscordBot, 'discordBot');
    _txCore.logger = startModule(Logger, 'logger');
    _txCore.fxRunner = startModule(FxRunner, 'fxRunner');

    //Low Priority
    _txCore.translator = startModule(Translator, 'translator');
    _txCore.scheduler = startModule(Scheduler, 'scheduler');
    _txCore.statsManager = startModule(StatsManager, 'statsManager');
    _txCore.resourcesManager = startModule(ResourcesManager, 'resourcesManager');
    _txCore.playerlistManager = startModule(PlayerlistManager, 'playerlistManager');
    _txCore.persistentCache = startModule(PersistentCache, 'persistentCache');

    //Very Low Priority
    _txCore.dynamicAds = startModule(DynamicAds, 'dynamicAds');
    _txCore.cfxUpdateChecker = startModule(CfxUpdateChecker, 'cfxUpdateChecker');


    /**
     * MARK: Finalizing Boot
     */
    delete (globalThis as any).txCore;
    (globalThis as any).txCore = _txCore;
}
