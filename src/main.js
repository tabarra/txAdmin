//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('./extras/console');
cleanTerminal()

//==============================================================
//FIXME: I should be using dependency injection or something
globals = {
    monitor: null,
    logger: null,
    discordBot: null,
    authenticator: null,
    webServer: null,
    webConsole: null,
    fxServer: null,
    config: null,
    version: null
}

//==============================================================
class FXAdmin {
    constructor(){
        log(">>Starting FXAdmin");
        let localConfig = require('./extras/config');
        globals.config = localConfig.global;

        this.startAuthenticator(localConfig.authenticator).catch((err) => {
            HandleFatalError(err);
        });
        this.startDiscordBot(localConfig.discordBot).catch((err) => {
            HandleFatalError(err);
        });
        this.startFXServer(localConfig.fxServer).catch((err) => {
            HandleFatalError(err);
        });
        this.startLogger(localConfig.logger).catch((err) => {
            HandleFatalError(err);
        });
        this.startMonitor(localConfig.monitor).catch((err) => {
            HandleFatalError(err);
        });
        this.startWebServer(localConfig.webServer).catch((err) => {
            HandleFatalError(err);
        });
        this.startWebConsole(localConfig.webConsole).catch((err) => {
            HandleFatalError(err);
        });
        this.checkForUpdates().catch((err) => {
            HandleFatalError(err);
        });
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
        globals.fxServer = new FXRunner(config);
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
        const fs = require('fs');
        const util = require('util');
        const axios = require("axios");
        const readFile = util.promisify(fs.readFile);

        try {
            let [localVersion, remoteVersion] = await Promise.all([
                readFile('version.json'),
                axios.get('https://raw.githubusercontent.com/tabarra/fivem-fxadmin/master/version.json')
            ]);
            localVersion = JSON.parse(localVersion);
            remoteVersion = remoteVersion.data;
            globals.version = {
                current: localVersion.version,
                latest: remoteVersion.version,
                changelog: remoteVersion.changelog,
            };
            if(localVersion.version !== remoteVersion.version){
                logWarn(`A new version is available for FXAdmin - https://github.com/tabarra/fivem-fxadmin`);
            }
        } catch (error) {
            logError(`Error checking the current vs remote version.`);
        }
    }  
}


//==============================================================
function HandleFatalError(err){
    logError(err.message)
    logError(err.stack)
    process.exit(1);
}
process.on('unhandledRejection', (err) => {
    logError(">>Ohh nooooo - unhandledRejection")
    logError(err.message)
    logError(err.stack)
});
process.on('exit', (code) => {
    logWarn(">>Stopping FXAdmin");
});

//==============================================================
const server = new FXAdmin();