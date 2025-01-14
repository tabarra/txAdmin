const modulename = 'ConfigStore:Migration';
import fs from 'node:fs';
import { ConfigFileData, ConfigSchemas_v2, PartialTxConfigs, TxConfigs } from './schema/index';
import { txEnv } from '@core/globalData';
import { parseArgsStringToArgv } from 'string-argv';
import { cloneDeep, isEqual } from 'lodash-es';
import fatalError from '@lib/fatalError';
import { CONFIG_VERSION } from '.';
import { restructureOldConfig } from './schema/oldConfig';
import { getConfigDefaults, getConfigScaffold } from './configParser';
import { alphanumeric } from 'nanoid-dictionary';
import { customAlphabet } from "nanoid";
import consoleFactory from '@lib/console';
const genBanTemplateId = customAlphabet(alphanumeric, 21);
const console = consoleFactory(modulename);


/**
 * Saves a backup of the current config file
 */
const saveBackupFile = (version: number) => {
    const bkpFileName = `config.backup.v${version}.json`;
    fs.copyFileSync(
        `${txEnv.profilePath}/config.json`,
        `${txEnv.profilePath}/${bkpFileName}`,
    );
    console.log(`A backup of your config file was saved on: ${bkpFileName}`);
}


/**
 * Migrates the old config file to the new schema
 */
export const migrateConfigFile = (fileData: any): ConfigFileData => {
    const oldConfig = cloneDeep(fileData);
    let newConfig: ConfigFileData | undefined;
    let oldVersion: number | undefined;

    //Sanity check
    if ('version' in fileData && typeof fileData.version !== 'number') {
        fatalError.ConfigStore(20, 'Your txAdmin config.json version is not a number!');
    }
    if (typeof fileData.version === 'number' && fileData.version > CONFIG_VERSION) {
        fatalError.ConfigStore(21, [
            `Your config.json file is on v${fileData.version}, and this txAdmin supports up to v${CONFIG_VERSION}.`,
            'This means you likely downgraded your txAdmin or FXServer.',
            'Please make sure your txAdmin is updated!',
            '',
            'If you want to downgrade FXServer (the "artifact") but keep txAdmin updated,',
            'you can move the updated "citizen/system_resources/monitor" folder',
            'to older FXserver artifact, replacing the old files.',
            `Alternatively, you can restore the v${fileData.version} backup on the folder below.`,
            ['File Path', `${txEnv.profilePath}/config.json`],
        ]);
    }
    //The v1 is implicit, if explicit then it's a problem
    if (fileData.version === 1) {
        throw new Error(`File with explicit version '1' should not exist.`);
    }


    //Migrate from v1 (no version) to v2
    //- remapping the old config to the new structure
    //- applying some default changes and migrations
    //- extracting just the non-default values
    //- truncating the serverName to 18 chars
    //- generating new banlist template IDs
    if (!('version' in fileData) && 'global' in fileData && 'fxRunner' in fileData) {
        console.warn('Updating your txAdmin config.json from v1 to v2.');
        oldVersion ??= 1;

        //Get the old configs in the new structure
        const remapped = restructureOldConfig(oldConfig);

        //Some migrations before comparing because defaults changed
        if (typeof remapped.restarter?.bootCooldown === 'number') {
            //@ts-ignore
            remapped.restarter.bootCooldown = Math.round(remapped.restarter.bootCooldown);
        }
        if (typeof remapped.fxRunner?.shutdownNoticeDelayMs === 'number') {
            //@ts-ignore
            remapped.fxRunner.shutdownNoticeDelayMs *= 1000;
        }
        if (remapped.fxRunner?.restartSpawnDelayMs === 750) {
            //@ts-ignore
            remapped.fxRunner.restartSpawnDelayMs = 500;
        }
        if (typeof remapped.fxRunner?.startupArgs === 'string') {
            //@ts-ignore
            remapped.fxRunner.startupArgs = remapped.fxRunner.startupArgs.length
                ? parseArgsStringToArgv(remapped.fxRunner.startupArgs)
                : [];
        }

        //Extract just the non-default values
        const baseConfigs = getConfigDefaults(ConfigSchemas_v2) as TxConfigs;
        const justNonDefaults = getConfigScaffold(ConfigSchemas_v2) as PartialTxConfigs;
        for (const [scopeKey, scopeConfigs] of Object.entries(baseConfigs)) {
            for (const [configKey, configDefault] of Object.entries(scopeConfigs)) {
                if (remapped[scopeKey][configKey] === undefined) continue;
                if (!isEqual(remapped[scopeKey][configKey], configDefault)) {
                    //@ts-ignore
                    justNonDefaults[scopeKey][configKey] = remapped[scopeKey][configKey];
                }
            }
        }

        //Last migrations
        if (typeof justNonDefaults.general?.serverName === 'string') {
            //@ts-ignore
            justNonDefaults.general.serverName = justNonDefaults.general.serverName.slice(0, 18);
        }
        if (Array.isArray(justNonDefaults.banlist?.templates)) {
            for (const tpl of justNonDefaults.banlist.templates) {
                if (typeof tpl.id !== 'string') continue;
                tpl.id = genBanTemplateId();
            }
        }

        //Final object
        newConfig = {
            version: 2,
            ...justNonDefaults,
        }
    }


    //Final check
    if (oldVersion && newConfig && newConfig.version === CONFIG_VERSION) {
        saveBackupFile(oldVersion);
        return newConfig;
    } else {
        throw new Error(`Unknown file version: ${fileData.version}`);
    }
}
