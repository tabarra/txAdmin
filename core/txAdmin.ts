import consoleFactory from '@lib/console';
import { getCoreProxy } from './boot/globalPlaceholder';

import TxManager from './txManager';
import ConfigStore from '@modules/ConfigStore';
import AdminStore from '@modules/AdminStore';
import DiscordBot from '@modules/DiscordBot';
import FxRunner from '@modules/FxRunner';
import Logger from '@modules/Logger';
import FxMonitor from '@modules/FxMonitor';
import FxScheduler from '@modules/FxScheduler';
import Metrics from '@modules/Metrics';
import Translator from '@modules/Translator';
import WebServer from '@modules/WebServer';
import FxResources from '@modules/FxResources';
import FxPlayerlist from '@modules/FxPlayerlist';
import Database from '@modules/Database';
import CacheStore from '@modules/CacheStore';
import UpdateChecker from '@modules/UpdateChecker';
const console = consoleFactory();


export type TxCoreType = {
    //Storage
    adminStore: AdminStore;
    cacheStore: CacheStore;
    configStore: ConfigStore;
    database: Database;
    logger: Logger;
    metrics: Metrics;

    //FXServer
    fxMonitor: FxMonitor;
    fxPlayerlist: FxPlayerlist;
    fxResources: FxResources;
    fxRunner: FxRunner;
    fxScheduler: FxScheduler;

    //Other
    discordBot: DiscordBot;
    translator: Translator;
    updateChecker: UpdateChecker;
    webServer: WebServer;
}

export default function bootTxAdmin() {
    /**
     * MARK: Setting up Globals
     */
    //Initialize the global txCore object
    const _txCore = {
        configStore: new ConfigStore(),
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
    //Helper function to start the modules & register callbacks
    const startModule = <T>(Class: GenericTxModule<T>): T => {
        const instance = new Class();
        if(Array.isArray(Class.configKeysWatched) && Class.configKeysWatched.length > 0){
            if(!('handleConfigUpdate' in instance) || typeof instance?.handleConfigUpdate !== 'function'){
                throw new Error(`Module '${Class.name}' has configKeysWatched[] but no handleConfigUpdate()`);
            }
            _txCore.configStore.registerUpdateCallback(
                Class.name,
                Class.configKeysWatched,
                instance.handleConfigUpdate.bind(instance),
            );
        }
        if(instance?.handleShutdown) {
            txManager.addShutdownHandler(instance.handleShutdown.bind(instance));
        }
        
        return instance as T;
    };

    //High Priority (required for banner) 
    _txCore.adminStore = startModule(AdminStore);
    _txCore.webServer = startModule(WebServer);
    _txCore.database = startModule(Database);

    //Required for signalStartReady()
    _txCore.fxMonitor = startModule(FxMonitor);
    _txCore.discordBot = startModule(DiscordBot);
    _txCore.logger = startModule(Logger);
    _txCore.fxRunner = startModule(FxRunner);

    //Low Priority
    _txCore.translator = startModule(Translator);
    _txCore.fxScheduler = startModule(FxScheduler);
    _txCore.metrics = startModule(Metrics);
    _txCore.fxResources = startModule(FxResources);
    _txCore.fxPlayerlist = startModule(FxPlayerlist);
    _txCore.cacheStore = startModule(CacheStore);

    //Very Low Priority
    _txCore.updateChecker = startModule(UpdateChecker);


    /**
     * MARK: Finalizing Boot
     */
    delete (globalThis as any).txCore;
    (globalThis as any).txCore = _txCore;
}
