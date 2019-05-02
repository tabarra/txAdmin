//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('./extras/console');
cleanTerminal()

//==============================================================
//FIXME: I should be using dependency injection or something
globals = {
    monitor: null,
    authenticator: null,
    webServer: null,
    fxServer: null,
    config: null
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
        this.startFXServer(localConfig.fxServer).catch((err) => {
            HandleFatalError(err);
        });
        this.startMonitor(localConfig.monitor).catch((err) => {
            HandleFatalError(err);
        });
        this.startWebServer(localConfig.webServer).catch((err) => {
            HandleFatalError(err);
        });
    }

    //==============================================================
    async startAuthenticator(config){
        const Monitor = require('./components/authenticator')
        globals.authenticator = new Monitor(config);
    }

    //==============================================================
    async startFXServer(config){
        const FXRunner = require('./components/fxRunner')
        globals.fxServer = new FXRunner(config);
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