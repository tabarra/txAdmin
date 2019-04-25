//Visual separation rocks
console.log("\n\n\n\n\n\n\n\n");
console.clear();

//Requires
const { log, logOk, logWarn, logError } = require('./extras/conLog');

//==============================================================
//FIXME: I should be using dependency injection or something
globals = {
    monitor: null,
    webServer: null,
    fxServer: null
}

//==============================================================
class FXAdmin {
    constructor(){
        log(">>Iniciando FXAdmin");
        this.config = require('./extras/config'),

        this.startMonitor().catch((err) => {
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
    async startMonitor(){
        const Monitor = require('./components/monitor')
        globals.monitor = new Monitor(this.config.monitor);
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
    logWarn(">>Encerrando FXAdmin");
});

//==============================================================
const server = new FXAdmin();