const modulename = 'SetupProfile';
import path from 'node:path';
import fs from 'fs-extra';
import chalk from 'chalk';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);


//Helpers
const DIVIDER = '='.repeat(57);

//Default config structure
const defaultConfig = {
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


//================================================================
export default (osType, fxServerPath, fxServerVersion, serverProfile, profilePath) => {
    console.log(DIVIDER);
    //Sanity check presence of profile
    if (fs.existsSync(profilePath)) {
        console.error(`There is already a profile named '${serverProfile}'.`);
        process.exit(500);
    }

    //Create new profile folder
    console.log('Creating new profile folder...');
    try {
        const jsonConfig = JSON.stringify(defaultConfig, null, 2);
        fs.mkdirSync(profilePath);
        fs.mkdirSync(`${profilePath}/logs/`);
        fs.mkdirSync(`${profilePath}/data/`);
        fs.writeFileSync(`${profilePath}/config.json`, jsonConfig);
    } catch (error) {
        console.error(`Failed to set up folder structure in '${profilePath}' with error:`);
        console.dir(error);
        process.exit(501);
    }
    console.ok(`Server profile was saved in '${profilePath}'`);


    //Saving start.bat
    if (osType == 'windows') {
        try {
            const batLines = [
                `@echo off`,
                `"${fxServerPath}/FXServer.exe" +set serverProfile "${serverProfile}"`,
                `pause`
            ];
            const batFolder = path.resolve(fxServerPath, '..');
            const batPath = path.join(batFolder, `start_${fxServerVersion}_${serverProfile}.bat`);
            fs.writeFileSync(batPath, batLines.join('\r\n'));
            console.ok(`You can use ${chalk.inverse(batPath)} to start this profile.`);
        } catch (error) {
            console.warn(`Failed to create 'start_${fxServerVersion}_${serverProfile}.bat' with error:`);
            console.dir(error);
        }
    }
    console.log(DIVIDER);
};
