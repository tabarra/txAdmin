//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('./extras/console');

//NOTE: temp node version checker
if(!process.version.startsWith('v10.')){
    cleanTerminal();
    logError(`FATAL ERROR: txAdmin doesn't support NodeJS ${process.version}, please install NodeJS v10 LTS!`);
    process.exit();
}

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
        allVersions: []
    },
    resourceNotFound: null //FIXME: temp hack
}

//==============================================================
class txAdmin {
    constructor(){
        //Print MOTD
        const figlet = require('figlet');
        let ascii = figlet.textSync('txAdmin');
        let separator = '='.repeat(46);
        let motd = `${separator}\n${ascii}\n${separator}`;
        cleanTerminal();
        console.log(motd);
        log(">>Starting txAdmin");

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
        const updateChecker = require('./extras/updateChecker');
        updateChecker();
        setInterval(updateChecker, 30 * 60 * 1000);
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
}


//==============================================================
function HandleFatalError(err, context){
    if(err.message.includes('Cannot find module')){
        logError(`Error starting '${context}' module. Make sure you executed 'npm install'.`)
        if(globals.config.verbose) dir(error);
    }else{
        logError(`Error starting '${context}' module: ${err.message}`)
        logError(err.stack, context)
    }
    
    process.exit();
}
process.stdin.on('error', (data) => {});
process.stdout.on('error', (data) => {});
process.stderr.on('error', (data) => {});
process.on('unhandledRejection', (err) => {
    logError(">>Ohh nooooo - unhandledRejection")
    logError(err.message)
    logError(err.stack)
});
process.on('uncaughtException', function(err) {
    logError(">>Ohh nooooo - uncaughtException")
    logError(err.message)
    logError(err.stack)
});
process.on('exit', (code) => {
    log(">>Stopping txAdmin");
});

//==============================================================
const server = new txAdmin();
