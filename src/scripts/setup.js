//Test environment conditions
const helpers = require('../extras/helpers');
helpers.dependencyChecker();

//Requires
const os = require('os');
const fs = require('fs');
const readline = require('readline');
const { promisify } = require('util');
const del = require('del');
const chalk = require('chalk');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
cleanTerminal()
const context = 'Setup';
const printDivider = () => { log('='.repeat(64), context) };



//================================================================
//=================================================== Setup
//================================================================
//Setting up ReadLine
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
readline.Interface.prototype.question[promisify.custom] = function (prompt) {
    return new Promise(resolve =>
        readline.Interface.prototype.question.call(this, prompt, resolve),
    );
};
readline.Interface.prototype.questionAsync = promisify(
    readline.Interface.prototype.question,
);

let configSkeletal = {
    global: {
        verbose: false,
        publicIP: "change-me",
        serverName: "change-me",
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
    webServer: {
        port: null
    },
    discordBot: {
        enabled: false,
        token: null,
        announceChannel: null,
        statusCommand: '/status'
    },
    fxRunner: {
        buildPath: null,
        basePath: null,
        cfgPath: null,
        setPriority: false,
        onesync: false,
        autostart: false,
        quiet: false
    }
}



//================================================================
//=================================================== Functions
//================================================================
//Ask yes/no question
async function askForYN(question, defaultAnswer, persist) {
    //Sanity check
    if (typeof question !== 'string') throw new Error('Expected string for question');
    if (typeof defaultAnswer === 'undefined') defaultAnswer = true;
    if (typeof defaultAnswer !== 'boolean') throw new Error('Expected boolean for defaultAnswer');
    if (typeof persist === 'undefined') persist = false;
    if (typeof persist !== 'boolean') throw new Error('Expected boolean for persist');

    //Question loop
    let opts = (defaultAnswer) ? 'Y/n' : 'y/N';
    question = `> ${question} (${opts}) `;
    while (true) {
        let resp = (await rl.questionAsync(question)).toLowerCase();

        if (resp == '') {
            resp = defaultAnswer;
        } else if (resp === 'y' || resp === 'yes') {
            resp = true;
        } else if (resp === 'n' || resp === 'no') {
            resp = false;
        } else {
            console.log('Invalid alternative.');
            if (persist) {
                continue;
            } else {
                return null;
            }
        }

        return resp;
    }
}


//Ask question and get a numeric response
async function askForNumber(question, defValue) {
    //Sanity check
    if (typeof question !== 'string') throw new Error('Expected string for question');
    if (typeof defValue === 'undefined') defValue = false;

    //Question loop
    while (true) {
        let resp = (await rl.questionAsync(`> ${question} `)).trim();

        if (resp == '') {
            return defValue;
        }

        let regex = /^\d+$/;
        if (!regex.test(resp)) {
            console.log(`This field only accept numbers.`);
            continue;
        } else {
            return parseInt(resp);
        }
    }
}


//================================================================
//=================================================== Main
//================================================================
//Print usage info
printDivider();
logOk(`Usage: node src/scripts/setup [server-profile-name]`, context);
logOk(`Usage: When the profile name is not specified, "default" will be used.`, context);
printDivider();

//Checking OS type
let osType = os.type();
let isLinux = null;
if (osType === 'Linux') {
    isLinux = true;
} else if (osType === 'Windows_NT') {
    isLinux = false;
} else {
    logError(`OS type not supported: ${osType}`, context);
    process.exit();
}

(async () => {
    //Check  argv
    let serverProfile;
    if (process.argv[2]) {
        serverProfile = process.argv[2].replace(/[^a-z0-9._-]/gi, "");
        if (serverProfile === 'example') {
            logError(`You can't use the example profile.`, context);
            process.exit();
        }
        log(`Server profile selected: '${serverProfile}'`, context);
    } else {
        serverProfile = 'default';
        log(`Server profile not set, using default`, context);
    }
    let profilePath = `data/${serverProfile}/`;


    //Check if server profile already exists
    if (fs.existsSync(profilePath)) {
        logWarn(`There is already a profile named '${serverProfile}'.`, context);
        let resp = await askForYN('Do you want to overwrite it?', false);
        if (resp === false || resp === null) {
            logWarn('Aborting', context);
            process.exit();
        } else {
            logWarn(`You can cancel at any moment by pressing CTRL+C.`, context);
        }
    }

    //Ask for the webserver port
    console.log("> What TCP port should txAdmin use to host the web panel?");
    let webPort = await askForNumber("Range 0-65535 (or press enter for the default value of 40120)", 40120);
    configSkeletal.webServer.port = webPort;
    printDivider();

    //Check (again) for previous profile and wipe contents
    if (fs.existsSync(profilePath)) {
        try {
            log('Wiping old profile data...', context);
            const deletedFiles = del.sync(`${profilePath}`);
            log(`Deleted ${deletedFiles.length} files from ${profilePath}.`, context);
        } catch (error) {
            logError(`Error while wiping cache: ${error.message}`, context);
            dir(error);
        }
    }

    //Create new profile folder
    log('Creating new profile folder...', context);
    try {
        let jsonConfig = JSON.stringify(configSkeletal, null, 2);
        fs.mkdirSync(profilePath);
        fs.mkdirSync(`${profilePath}/logs/`);
        fs.mkdirSync(`${profilePath}/data/`);
        fs.writeFileSync(`${profilePath}/messages.json`, '[]');
        fs.writeFileSync(`${profilePath}/commands.json`, '[]');
        fs.writeFileSync(`${profilePath}/config.json`, jsonConfig);

        if(!isLinux){
            let batch = `@echo off\r\n cd ../..\r\n node src ${serverProfile}\r\n pause`;
            fs.writeFileSync(`${profilePath}/start.bat`, batch);
        }
    } catch (error) {
        logError(`Error setting up folder structure in '${profilePath}'`, context);
        logError(error);
        process.exit();
    }
    printDivider();

    //Printing goodbye :)
    logOk(`Server profile saved in '${profilePath}'`, context);
    let cmd = chalk.inverse(` node src ${serverProfile} `);
    logOk(`To start txAdmin with this profile run: ${cmd}`, context);
    if(!isLinux){
        let cmd2 = chalk.inverse(` ${profilePath}start.bat `);
        logOk(`You can also execute: ${cmd2}`, context);
    }
    process.exit();
})();
