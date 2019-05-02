//Requires
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('./extras/console');
cleanTerminal()

//==============================================================
//FIXME: I should be using dependency injection or something
globals = {
    monitor: null,
    authenticator: null,
    webServer: null,
    fxServer: null
}

//==============================================================
class FXAdmin {
    constructor(){
        log(">>Starting FXAdmin");
        this.config = require('./extras/config'),

        this.startMonitor().catch((err) => {
            HandleFatalError(err);
        });
        this.startAuthenticator().catch((err) => {
            HandleFatalError(err);
        });
        this.startWebServer().catch((err) => {
            HandleFatalError(err);
        });
        this.startFXServer().catch((err) => {
            HandleFatalError(err);
        });
    }

    //==============================================================
    async startAuthenticator(){
        const Monitor = require('./components/monitor')
        globals.monitor = new Monitor(this.config.monitor);
    }

    //==============================================================
    async startMonitor(){
        const Authenticator = require('./components/authenticator')
        globals.authenticator = new Authenticator(this.config.authenticator);
    }

    //==============================================================
    async startWebServer(){
        const WebServer = require('./components/webServer')
        globals.webServer = new WebServer(this.config.webServer);
    }

    //==============================================================
    async startFXServer(){
        const FXRunner = require('./components/fxRunner')
        globals.fxServer = new FXRunner(this.config.fxServer);
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