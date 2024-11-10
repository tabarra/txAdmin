const modulename = 'Setup';
import path from 'node:path';
import fs from 'node:fs';

import chalk from 'chalk';
import consoleFactory from '@lib/console';
import fatalError from '@lib/fatalError';
import { txEnv } from '@core/globalData';
const console = consoleFactory(modulename);


//FIXME: deprecate this - do @modules/ConfigStore/utils.ts > encodeConfig() or something like that
const CONFIG_STRUCTURE = {
    global: {
        serverName: null,
        language: 'en',
    },
    logger: {},
    monitor: {
        restarterSchedule: [],
    },
    webServer: {},
    discordBot: {
        enabled: false,
        token: null,
        announceChannel: null,
    },
    fxRunner: {
        serverDataPath: null,
        cfgPath: null,
        autostart: true,
    },
};

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
        fs.writeFileSync(
            path.join(txEnv.profilePath, 'config.json'), 
            JSON.stringify(CONFIG_STRUCTURE, null, 2)
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
    if (txEnv.osType == 'windows') {
        const batFilename = `start_${txEnv.fxsVersion}_${txEnv.profile}.bat`;
        try {
            const fxsPath = path.join(txEnv.fxServerPath, 'FXServer.exe');
            const batLines = [
                `@echo off`,
                `"${fxsPath}" +set serverProfile "${txEnv.profile}"`,
                `pause`
            ];
            const batFolder = path.resolve(txEnv.fxServerPath, '..');
            const batPath = path.join(batFolder, batFilename);
            fs.writeFileSync(batPath, batLines.join('\r\n'));
            console.ok(`You can use ${chalk.inverse(batPath)} to start this profile.`);
        } catch (error) {
            console.warn(`Failed to create '${batFilename}' with error:`);
            console.dir(error);
        }
    }
    console.log(console.DIVIDER);
};
