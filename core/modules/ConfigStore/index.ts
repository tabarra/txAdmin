const modulename = 'ConfigStore';
import fs from 'node:fs';
import { cloneDeep, compact } from 'lodash-es';
import consoleFactory from '@lib/console';
import fatalError from '@lib/fatalError';
import { txEnv } from '@core/globalData';
import { ConfigFileData, ConfigSchemas_v2, StoredTxConfigs, TxConfigs } from './schema';
import { migrateConfigFile } from './configMigrations';
import { deepFreeze } from '@lib/misc';
import { parseConfigFileData, processParsedConfigs } from './configParser';
const console = consoleFactory(modulename);


//Types
type RefreshConfigFunc = (newConfig: any, keysUpdated: string[]) => void;

//Consts
export const CONFIG_VERSION = 2;


/**
 * Module to handle the configuration file, validation, defaults and retrieval.
 * The setup is fully sync, as nothing else can start without the config.
 */
export default class ConfigStore /*does not extend TxModuleBase*/ {
    private readonly configFilePath = `${txEnv.profilePath}/config.json`;
    private storedConfig: StoredTxConfigs;
    private activeConfig: TxConfigs;

    private readonly moduleRefreshCallbacks: {
        //NOTE: aqui os módulos _deveriam_ estar na ordem em que foram inicializados
        keys: string[],
        callback: RefreshConfigFunc
    }[] = [];

    constructor() {
        //Load raw file
        //TODO: create a lock file to prevent starting twice the same config file?
        let fileRaw;
        try {
            fileRaw = fs.readFileSync(this.configFilePath, 'utf8');
        } catch (error) {
            fatalError.ConfigStore(10, [
                'Unable to read configuration file (filesystem error).',
                ['Path', this.configFilePath],
                ['Error', (error as Error).message],
            ]);
        }

        //Json parse
        let fileData: ConfigFileData;
        try {
            fileData = JSON.parse(fileRaw);
        } catch (error) {
            fatalError.ConfigStore(11, [
                'Unable to parse configuration file (invalid JSON).',
                'This means the file somehow got corrupted and is not a valid anymore.',
                ['Path', this.configFilePath],
                ['Error', (error as Error).message],
            ]);
        }

        //Check version & migrate if needed
        let fileMigrated = false;
        if (fileData?.version !== CONFIG_VERSION) {
            try {
                fileData = migrateConfigFile(fileData);
                fileMigrated = true;
            } catch (error) {
                fatalError.ConfigStore(25, [
                    'Unable to migrate configuration file.',
                    ['Path', this.configFilePath],
                    ['File version', String(fileData?.version)],
                    ['Supported version', String(CONFIG_VERSION)],
                ], error);
            }
        }

        //Parse & validate
        try {
            const configItems = parseConfigFileData(fileData);
            if(!configItems.length) throw new Error(`Empty config file`);
            const config = processParsedConfigs(configItems, ConfigSchemas_v2);
            this.storedConfig = config.stored as StoredTxConfigs;
            this.activeConfig = config.active as TxConfigs;
        } catch (error) {
            fatalError.ConfigStore(14, [
                'Unable to process configuration file.',
            ], error);
        }

        //If migrated, write the new file
        if (fileMigrated) {
            try {
                const outFile = {
                    version: CONFIG_VERSION,
                    ...this.storedConfig,
                };
                fs.writeFileSync(this.configFilePath, JSON.stringify(outFile, null, 2));
            } catch (error) {
                fatalError.ConfigStore(26, [
                    'Unable to save the updated config.json file.',
                    ['Path', this.configFilePath],
                ], error);
            }
        }

        //Reflect to global
        this.updatePublicConfig();
    }

    /**
    * Mirrors the #config object to the public deep frozen config object
    */
    private updatePublicConfig() {
        (globalThis as any).txConfig = deepFreeze(cloneDeep(this.activeConfig));
    }



    
    getConfigSaved(key: string) {
        //TODO: get the value that is saved in the config file
        //FIXME: getStoredConfig instead? Full object, not just one key
    }
    saveConfigBulk(changes: { [key: string]: any }) {
        //TODO: set multiple values in the config file
        this.processCallbacks(Object.keys(changes));
    }
    saveConfig(key: string, value: any) {
        //TODO: set the value in the config file
        this.processCallbacks([key]);
    }
    processCallbacks(updatedKeys: string[]) {
        for (const txModule of this.moduleRefreshCallbacks) {
            //TODO: check if keys match, allow wildcards
            const updatedMatchedKeys = updatedKeys.filter(k => txModule.keys.includes(k));
            txModule.callback({}, updatedMatchedKeys);
        }
    }
    registerUpdateCallback(keys: string[], callback: RefreshConfigFunc) {
        this.moduleRefreshCallbacks.push({ keys, callback });
    }
}
