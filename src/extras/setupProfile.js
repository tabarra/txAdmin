//Requires
const modulename = 'SetupProfile';
const ac = require('ansi-colors');
const fs = require('fs-extra');
const path = require('path');
const slash = require('slash');
const { dir, log, logOk, logWarn, logError } = require('./console')(modulename);

//Helpers
const printDivider = () => { log('='.repeat(57)) };
const cleanPath = (x) => { return slash(path.normalize(x)) };

//Default config structure
let defaultConfig = {
    global: {
        verbose: false,
        serverName: null,
        language: "en",
        forceFXServerPort: null
    },
    logger: {},
    monitor: {
        restarterSchedule: [],
        healthCheck: {
            failThreshold: 15,
            failLimit: 300,
        },
        heartBeat: {
            failThreshold: 15,
            failLimit: 30,
        }
    },
    authenticator: {},
    webServer: {},
    discordBot: {
        enabled: false,
        token: null,
        announceChannel: null,
    },
    fxRunner: {
        serverDataPath: null,
        cfgPath: null,
        onesync: false,
        autostart: false,
        quiet: false
    }
}


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
        let jsonConfig = JSON.stringify(defaultConfig, null, 2);
        fs.mkdirSync(profilePath);
        fs.mkdirSync(`${profilePath}/logs/`);
        fs.mkdirSync(`${profilePath}/data/`);
        // fs.writeFileSync(`${profilePath}/messages.json`, '[]');
        // fs.writeFileSync(`${profilePath}/commands.json`, '[]');
        fs.writeFileSync(`${profilePath}/config.json`, jsonConfig);
    } catch (error) {
        logError(`Failed to set up folder structure in '${profilePath}' with error: ${error.message}`);
        process.exit();
    }
    logOk(`Server profile was saved in '${profilePath}'`);
    

    //Saving start.bat
    if(osType == 'windows'){
        try {
            let batData = `@echo off\r\n
                ${fxServerPath}/FXServer.exe +set serverProfile "${serverProfile}"\r\n
                pause`;
            let batFolder = path.resolve(fxServerPath, '..');
            let batPath  = path.join(batFolder, `start_${fxServerVersion}_${serverProfile}.bat`);
            fs.writeFileSync(batPath, batData);
            logOk(`You can use ${ac.inverse(batPath)} to start this profile.`);
        } catch (error) {
            logWarn(`Failed to create 'start_${fxServerVersion}_${serverProfile}.bat' with error: ${error.message}`);
        }
    }
    printDivider();
}
