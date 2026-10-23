import path from 'node:path';
import fs from 'node:fs';

import fatalError from '@lib/fatalError';
import { txEnv } from '@core/globalData';
import ConfigStore from '@modules/ConfigStore';
import { chalkInversePad } from '@lib/misc';


/**
 * Ensure the profile subfolders exist
 */
export const ensureProfileStructure = () => {
    const dataPath = path.join(txEnv.profilePath, 'data');
    if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath);
    }

    const logsPath = path.join(txEnv.profilePath, 'logs');
    if (!fs.existsSync(logsPath)) {
        fs.mkdirSync(logsPath);
    }
}


/**
 * Setup the profile folder structure
 */
export const setupProfile = () => {
    //Create new profile folder
    try {
        fs.mkdirSync(txEnv.profilePath);
        const configStructure = ConfigStore.getEmptyConfigFile();
        fs.writeFileSync(
            path.join(txEnv.profilePath, 'config.json'),
            JSON.stringify(configStructure, null, 2)
        );
        ensureProfileStructure();
    } catch (error) {
        fatalError.Boot(4, [
            'Failed to set up data folder structure.',
            ['Path', txEnv.profilePath],
        ], error);
    }
    console.log(`Server data will be saved in ${chalkInversePad(txEnv.profilePath)}`);
};
