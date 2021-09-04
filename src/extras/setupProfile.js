//Requires
const modulename = 'SetupProfile';
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { dir, log, logOk, logWarn, logError } = require('./console')(modulename);

//Helpers
const printDivider = () => { log('='.repeat(57)); };

//Default config structure
const defaultConfig = {
    global: {
        verbose: false,
        serverName: null,
        language: 'en',
        forceFXServerPort: null,
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
module.exports = (osType, fxServerPath, fxServerVersion, serverProfile, profilePath) => {
    printDivider();
    //Sanity check presence of profile
    if (fs.existsSync(profilePath)) {
        logError(`There is already a profile named '${serverProfile}'.`);
        process.exit();
    }

    //Create new profile folder
    log('Creating new profile folder...');
    try {
        const jsonConfig = JSON.stringify(defaultConfig, null, 2);
        fs.mkdirSync(profilePath);
        fs.mkdirSync(`${profilePath}/logs/`);
        fs.mkdirSync(`${profilePath}/data/`);
        fs.writeFileSync(`${profilePath}/config.json`, jsonConfig);
    } catch (error) {
        logError(`Failed to set up folder structure in '${profilePath}' with error: ${error.message}`);
        process.exit();
    }
    logOk(`Server profile was saved in '${profilePath}'`);


    //Saving start.bat
    if (osType == 'windows') {
        try {
            const batData = `@echo off
"${fxServerPath}/FXServer.exe" +set serverProfile "${serverProfile}"
pause`;
            const batFolder = path.resolve(fxServerPath, '..');
            const batPath  = path.join(batFolder, `start_${fxServerVersion}_${serverProfile}.bat`);
            fs.writeFileSync(batPath, batData);
            logOk(`You can use ${chalk.inverse(batPath)} to start this profile.`);
        } catch (error) {
            logWarn(`Failed to create 'start_${fxServerVersion}_${serverProfile}.bat' with error: ${error.message}`);
        }
    }
    printDivider();
};
