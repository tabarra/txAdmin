const modulename = 'ConfigStore';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { cloneDeep } from 'lodash-es';
import consoleFactory from '@lib/console';
import fatalError from '@lib/fatalError';
import { txEnv } from '@core/globalData';
import { ConfigFileData, ConfigSchemas_v2, PartialTxConfigs, TxConfigs } from './schema';
import { migrateConfigFile } from './configMigrations';
import { deepFreeze } from '@lib/misc';
import { parseConfigFileData, bootstrapConfigProcessor, runtimeConfigProcessor, getConfigDefaults } from './configParser';
import { ListOf, SYM_RESET_CONFIG } from './schema/utils';
import { CCLOG_VERSION, ConfigChangelogEntry, ConfigChangelogFileSchema, truncateConfigChangelog } from './changelog';
const console = consoleFactory(modulename);


//Types
export type RefreshConfigKey = { scope: string, key: string };
export type RefreshConfigFunc = (updatedConfigs: RefreshConfigKey[]) => void;
type RefreshConfigRegistry = {
    callback: RefreshConfigFunc,
    rules: RefreshConfigKey[],
}[];

//Consts
export const CONFIG_VERSION = 2;


/**
 * Module to handle the configuration file, validation, defaults and retrieval.
 * The setup is fully sync, as nothing else can start without the config.
 */
export default class ConfigStore /*does not extend TxModuleBase*/ {
    //Statics
    public static Schema = ConfigSchemas_v2;
    public static SchemaDefaults = getConfigDefaults(ConfigSchemas_v2);
    public static SYM_RESET_CONFIG = SYM_RESET_CONFIG;

    //Instance
    private readonly changelogFilePath = `${txEnv.profilePath}/data/configChangelog.json`;
    private readonly configFilePath = `${txEnv.profilePath}/config.json`;
    private readonly moduleRefreshCallbacks: RefreshConfigRegistry = []; //Modules are in boot order
    private unknownConfigs: ListOf<any>; //keeping so we can save it back
    private storedConfigs: PartialTxConfigs;
    private activeConfigs: TxConfigs;
    private changelog: ConfigChangelogEntry[] = [];

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
            if (!configItems.length) throw new Error(`Empty config file`);
            const config = bootstrapConfigProcessor(configItems, ConfigSchemas_v2, ConfigStore.SchemaDefaults);
            this.unknownConfigs = config.unknown;
            this.storedConfigs = config.stored as PartialTxConfigs;
            this.activeConfigs = config.active as TxConfigs;
        } catch (error) {
            fatalError.ConfigStore(14, [
                'Unable to process configuration file.',
            ], error);
        }

        //If migrated, write the new file
        if (fileMigrated) {
            try {
                this.saveFile(this.storedConfigs);
            } catch (error) {
                fatalError.ConfigStore(26, [
                    'Unable to save the updated config.json file.',
                    ['Path', this.configFilePath],
                ], error);
            }
        }

        //Reflect to global
        this.updatePublicConfig();

        //Load changelog
        setImmediate(() => {
            this.loadChangelog();
        });
    }


    /**
    * Mirrors the #config object to the public deep frozen config object
    */
    private updatePublicConfig() {
        (globalThis as any).txConfig = deepFreeze(cloneDeep(this.activeConfigs));
    }


    /**
     * Returns the stored config object, with only the known keys
     */
    public getStoredConfig() {
        return deepFreeze(cloneDeep(this.storedConfigs));
    }


    /**
     * Applies an input config object to the stored and active configs, then saves it to the file
     */
    public saveConfigs(inputConfig: PartialTxConfigs, author: string | null) {
        //Process each item
        const parsedInput = parseConfigFileData(inputConfig);
        const processed = runtimeConfigProcessor(
            parsedInput,
            ConfigSchemas_v2,
            this.storedConfigs,
            this.activeConfigs,
        );

        //If nothing thrown, update the state, file, and 
        this.saveFile(processed.stored);
        this.storedConfigs = processed.stored as PartialTxConfigs;
        this.activeConfigs = processed.active as TxConfigs;
        this.updatePublicConfig();
        this.processCallbacks(processed.activeKeysChanges);
        setImmediate(() => {
            this.logChanges(author ?? 'txAdmin', processed.storedKeysChanges).catch(() => { });
        });
        return processed.storedKeysChanges;
    }


    /**
     * Saves the config.json file, maintaining the unknown configs
     */
    public saveFile(toStore: PartialTxConfigs) {
        const outFile = {
            version: CONFIG_VERSION,
            ...this.unknownConfigs,
            ...toStore,
        };
        fs.writeFileSync(this.configFilePath, JSON.stringify(outFile, null, 2));
    }


    /**
     * Logs changes to logger and changelog file
     */
    private async logChanges(author: string, updatedConfigs: RefreshConfigKey[]) {
        const updatedKeys = updatedConfigs.map(c => `${c.scope}.${c.key}`);
        txCore.logger.admin.write(author, `Config changes: ${updatedKeys.join(', ')}`);
        this.changelog.push({
            author,
            ts: Date.now(),
            keys: updatedKeys,
        });
        this.changelog = truncateConfigChangelog(this.changelog);
        try {
            const json = JSON.stringify({
                version: CCLOG_VERSION,
                log: this.changelog,
            });
            await fsp.writeFile(this.changelogFilePath, json);
        } catch (error) {
            console.warn(`Failed to save ${this.changelogFilePath} with message: ${(error as any).message}`);
        }
    }

    /**
     * Loads the changelog file
     */
    private async loadChangelog() {
        try {
            const rawFileData = await fsp.readFile(this.changelogFilePath, 'utf8');
            const fileData = JSON.parse(rawFileData);
            if (fileData?.version !== CCLOG_VERSION) throw new Error(`invalid_version`);
            const changelogData = ConfigChangelogFileSchema.parse(fileData);
            this.changelog = truncateConfigChangelog(changelogData.log);
        } catch (error) {
            if ((error as any)?.code === 'ENOENT') {
                console.verbose.debug(`${this.changelogFilePath} not found, making a new one.`);
            } else if ((error as any)?.message === 'invalid_version') {
                console.warn(`Failed to load ${this.changelogFilePath} due to invalid version.`);
                console.warn('Since this is not a critical file, it will be reset.');
            } else {
                console.warn(`Failed to load ${this.changelogFilePath} with message: ${(error as any).message}`);
                console.warn('Since this is not a critical file, it will be reset.');
            }
        }
    }


    /**
     * Process the callbacks for the modules that registered for config changes
     */
    private processCallbacks(updatedConfigs: RefreshConfigKey[]) {
        for (const txModule of this.moduleRefreshCallbacks) {
            for (const updatedConfig of updatedConfigs) {
                const changesMatched = txModule.rules.some(
                    rule => (
                        rule.scope === updatedConfig.scope &&
                        (rule.key === updatedConfig.key || rule.key === '*')
                    )
                );

                if (changesMatched) {
                    setImmediate(() => {
                        txModule.callback(updatedConfigs);
                    });
                    break; // Break the loop once the callback is called for this module
                }
            }
        }
    }

    /**
     * Register a callback to be called when the config is updated
     */
    public registerUpdateCallback(rules: string[], callback: RefreshConfigFunc) {
        this.moduleRefreshCallbacks.push({
            callback,
            rules: rules.map(rule => {
                const [scope, key] = rule.split('.');
                return { scope, key };
            }),
        });
    }
}
