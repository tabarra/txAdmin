const modulename = 'ConfigStore:Migration';
import fs from 'node:fs';
import { ConfigFileData, PartialTxConfigs } from './schema/index';
import { txEnv } from '@core/globalData';
import { cloneDeep } from 'lodash-es';
import fatalError from '@lib/fatalError';
import { CONFIG_VERSION } from './index'; //FIXME: circular_dependency
import { migrateOldConfig } from './schema/oldConfig';
import consoleFactory from '@lib/console';
import { chalkInversePad } from '@lib/misc';
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
    console.log(`A backup of your config file was saved as: ${chalkInversePad(bkpFileName)}`);
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
        
        //Final object
        const justNonDefaults = migrateOldConfig(oldConfig) as PartialTxConfigs;
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
