const modulename = 'Setup';
import path from 'node:path';
import fs from 'node:fs';

import consoleFactory from '@lib/console';
import fatalError from '@lib/fatalError';
import { txEnv } from '@core/globalData';
import ConfigStore from '@modules/ConfigStore';
import { chalkInversePad } from '@lib/misc';
const console = consoleFactory(modulename);


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
    console.log(console.DIVIDER);
    //Create new profile folder
    console.log('Creating new profile folder...');
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
            'Failed to set up folder structure for the new profile.',
            ['Path', txEnv.profilePath],
        ], error);
    }
    console.ok(`Server profile was saved in '${txEnv.profilePath}'`);

    //Saving start.bat (yes, I also wish this didn't exist)
    if (txEnv.isWindows) {
        const batFilename = `start_${txEnv.fxsVersion}_${txEnv.profileName}.bat`;
        try {
            const fxsPath = path.join(txEnv.fxsPath, 'FXServer.exe');
            const batLines = [
                //TODO: add note to not add any server convars in here
                `@echo off`,
                `"${fxsPath}" +set serverProfile "${txEnv.profileName}"`,
                `pause`
            ];
            const batFolder = path.resolve(txEnv.fxsPath, '..');
            const batPath = path.join(batFolder, batFilename);
            fs.writeFileSync(batPath, batLines.join('\r\n'));
            console.ok(`You can use ${chalkInversePad(batPath)} to start this profile.`);
        } catch (error) {
            console.warn(`Failed to create '${batFilename}' with error:`);
            console.dir(error);
        }
    }
    console.log(console.DIVIDER);
};
