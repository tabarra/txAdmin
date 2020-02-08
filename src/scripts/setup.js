//Requires
const modulename = 'SetupScript';
const fs = require('fs-extra');
const path = require('path');
const slash = require('slash');
const { dir, log, logOk, logWarn, logError} = require('../extras/console')(modulename);
const osType = require('os').type();

//Helpers
const printDivider = () => { log('='.repeat(64)) };
const CleanPath = (x) => { return slash(path.normalize(x)) };

//Default config structure
let defaultConfig = {
    global: {
        verbose: false,
        publicIP: "change-me",
        serverName: "change-me",
        language: "en",
        forceFXServerPort: null
    },
    logger: {},
    monitor: {
        timeout: 1000,
        restarter: {
            failures: 15,
            schedule: []
        }
    },
    authenticator: {},
    webServer: {},
    discordBot: {
        enabled: false,
        token: null,
        announceChannel: null,
        statusCommand: '/status'
    },
    fxRunner: {
        basePath: null,
        cfgPath: null,
        setPriority: false,
        onesync: false,
        autostart: false,
        quiet: false
    }
}


//================================================================
module.exports = (serverRoot, serverProfile, profilePath) => {
    printDivider();
    //Sanity check presence of profile
    if (fs.existsSync(profilePath)) {
        logError(`There is already a profile named '${serverProfile}'.`);
        process.exit();
    }

    let citizenRootConvar = GetConvar('citizen_root', 'false');
    if(citizenRootConvar == 'false'){
        logError(`citizen_root convar not set`);
        process.exit();
    }
    const citizenRoot = CleanPath(citizenRootConvar);

    //Create new profile folder
    log('Creating new profile folder...');
    try {
        let jsonConfig = JSON.stringify(defaultConfig, null, 2);
        fs.mkdirSync(profilePath);
        fs.mkdirSync(`${profilePath}/logs/`);
        fs.mkdirSync(`${profilePath}/data/`);
        fs.writeFileSync(`${profilePath}/messages.json`, '[]');
        // fs.writeFileSync(`${profilePath}/commands.json`, '[]');
        fs.writeFileSync(`${profilePath}/config.json`, jsonConfig);
    } catch (error) {
        logError(`Failed to set up folder structure in '${profilePath}' with error: ${error.message}`);
        process.exit();
    }
    logOk(`Server profile was saved in '${profilePath}'`);

    //Saving start.bat
    if(osType == 'Windows_NT'){
        try {
            let batch = `@echo off\r\n${citizenRoot}/run.cmd +set serverProfile "${serverProfile}"\r\npause`;
            fs.writeFileSync(`${serverRoot}/start_${serverProfile}.bat`, batch);
        } catch (error) {
            logWarn(`Failed to create 'start_${serverProfile}.bat' in the current folder.`);
        }
    }

    logOk(`To start with this profile add the following argument: +set serverProfile "${serverProfile}"`);
    if(osType == 'Windows_NT'){
        logOk(`You can also execute run 'start_${serverProfile}.bat' added to this folder.`);
    }
    printDivider();
}
