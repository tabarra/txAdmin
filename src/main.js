//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('./extras/console');


//==============================================================
//FIXME: I should be using dependency injection or something
globals = {
    monitor: null,
    logger: null,
    discordBot: null,
    authenticator: null,
    webServer: null,
    webConsole: null,
    fxRunner: null,
    config: null,
    version: {
        current: '--',
        latest: '--',
        changelog: '--',
    }
}

//==============================================================
class FXAdmin {
    constructor(){
        //Print MOTD
        const figlet = require('figlet');
        let ascii = figlet.textSync('FXAdmin');
        let separator = '='.repeat(46);
        let motd = `${separator}\n${ascii}\n${separator}`;
        cleanTerminal();
        console.log(motd);
        log(">>Starting FXAdmin");

        //Prepare settings
        let localConfig = require('./extras/config');
        globals.config = localConfig.global;

        //Get current version
        try {
            let versioData = require('../version.json');
            if(!versioData || typeof versioData.version !== 'string') throw new Error('Invalid data in the version file.');
            globals.version.current = versioData.version;
        } catch (error) {
            logError(`Error reading or parsing the 'version.json' file:`);
            logError(error.message);
            process.exit();
        }

        //Start all modules
        this.startAuthenticator(localConfig.authenticator).catch((err) => {
            HandleFatalError(err, 'Authenticator');
        });
        this.startDiscordBot(localConfig.discordBot).catch((err) => {
            HandleFatalError(err, 'DiscordBot');
        });
        this.startFXServer(localConfig.fxRunner).catch((err) => {
            HandleFatalError(err, 'FXServer');
        });
        this.startLogger(localConfig.logger).catch((err) => {
            HandleFatalError(err, 'Logger');
        });
        this.startMonitor(localConfig.monitor).catch((err) => {
            HandleFatalError(err, 'Monitor');
        });
        this.startWebServer(localConfig.webServer).catch((err) => {
            HandleFatalError(err, 'WebServer');
        });
        this.startWebConsole(localConfig.webConsole).catch((err) => {
            HandleFatalError(err, 'WebConsole');
        });

        //Run Update Checker every 30 minutes
        this.checkForUpdates();
        setInterval(this.checkForUpdates, 30 * 60 * 1000);
    }

    //==============================================================
    async startAuthenticator(config){
        const Monitor = require('./components/authenticator')
        globals.authenticator = new Monitor(config);
    }

    //==============================================================
    async startDiscordBot(config){
        const DiscordBot = require('./components/discordBot')
        globals.discordBot = new DiscordBot(config);
    }

    //==============================================================
    async startFXServer(config){
        const FXRunner = require('./components/fxRunner')
        globals.fxRunner = new FXRunner(config);
    }

    //==============================================================
    async startLogger(config){
        const Logger = require('./components/logger')
        globals.logger = new Logger(config);
    }

    //==============================================================
    async startMonitor(config){
        const Authenticator = require('./components/monitor')
        globals.monitor = new Authenticator(config);
    }

    //==============================================================
    async startWebServer(config){
        const WebServer = require('./components/webServer')
        globals.webServer = new WebServer(config);
    }

    //==============================================================
    async startWebConsole(config){
        const WebConsole = require('./components/webConsole')
        globals.webConsole = new WebConsole(config);
    }

    //==============================================================
    async checkForUpdates(){
        const axios = require("axios");

        try {
            let rVer = await axios.get('https://raw.githubusercontent.com/tabarra/fivem-fxadmin/master/version.json');
            rVer = rVer.data;
            if(typeof rVer.version !== 'string' || typeof rVer.changelog !== 'string') throw new Error('Invalid remote version.json file');
            globals.version.latest = rVer.version;
            globals.version.changelog = rVer.changelog;
            if(globals.version.current !== rVer.version){
                logWarn(`A new version (v${rVer.version}) is available for FXAdmin - https://github.com/tabarra/fivem-fxadmin`, 'UpdateChecker');
            }
        } catch (error) {
            logError(`Error checking the current vs remote version. Go to the github repository to see if you need to update.`, 'UpdateChecker');
        }
    }  
}


//==============================================================
function HandleFatalError(err, context){
    if(err.message.includes('Cannot find module')){
        logError(`Error starting '${context}' module. Make sure you executed 'npm install'.`)
    }else{
        logError(`Error starting '${context}' module: ${err.message}`)
        logError(err.stack, context)
    }
    
    process.exit();
}
process.on('unhandledRejection', (err) => {
    logError(">>Ohh nooooo - unhandledRejection")
    logError(err.message)
    logError(err.stack)
});
process.on('exit', (code) => {
    log(">>Stopping FXAdmin");
});

//==============================================================
const server = new FXAdmin();
