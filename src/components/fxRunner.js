//Requires
const { spawn } = require('child_process');
const sleep = require('util').promisify(setTimeout)

const { log, logOk, logWarn, logError } = require('../extras/conLog');

module.exports = class FXRunner {
    constructor(config) {
        this.config = config;
        this.context = 'FXRunner';
        this.fxChild = null;
        this.fxChildStatus = null;
        this.outData = '';
        if(config.autostart) this.spawnServer();
    }

    
    //================================================================
    async spawnServer(){
        this.fxChild = spawn(
            "cmd.exe", 
            ['/c', `${this.config.serverPath}/run.cmd +exec ${this.config.cfgPath}`],
            {cwd: this.config.resPath}
        );
        logOk(`::FXRunner Iniciado com PID ${this.fxChild.pid}!`);
        this.fxChild.stdout.pipe(process.stdout);
        process.stdin.pipe(this.fxChild.stdin);

        this.fxChild.on('close', function (code, signal) {
            console.log('close: ' + `code ${code} and signal ${signal}`);
        });
        this.fxChild.on('disconnect', function () {
            console.log('disconnect');
        });
        this.fxChild.on('error', function (err) {
            console.log('error ', err);
        });
        this.fxChild.on('exit', function (code, signal) {
            logError('this.fxChild process exited with ' + `code ${code} and signal ${signal}`);
            // console.log("==========================");
            // console.log(JSON.stringify(this.fxChild));
            // console.log("==========================");    
        });
        this.fxChild.stderr.on('data', (data) => {
            console.error(`==============================================:\n${data}\n==============================================`);
        });
        // //The 'message' event is triggered when a this.fxChild process uses process.send() to send messages.
        // this.fxChild.on('message', function (message, sendHandle) {
        //     console.log(`Mensagem: ${message}`);
        // });
        this.fxChild.stdout.on('data', (data) => {
            // process.stdout.write(data.toString());
            this.outData += data;
        });
    }//Final spawnServer()


    //================================================================
    async restartServer(){
        this.fxChild.kill();
        cleanTerminal();
        await sleep(1000);
        this.spawnServer();
    }
    

    //================================================================
    killServer(){
        this.fxChild.kill();
        cleanTerminal();
    }
    

    //================================================================
    srvCmd(command){
        this.fxChild.stdin.write(command + "\n");
    }
    

    //================================================================
    async srvCmdBuffer(command, bufferTime){
        bufferTime = (bufferTime !== undefined)? bufferTime : 1000;
        this.outData = '';
        this.srvCmd(command);
        await sleep(bufferTime);
        return this.outData;
    }
} //Fim FXRunner()



function cleanTerminal(){
    console.log("\n\n\n\n\n\n\n\n");
    //console.clear();
    console.log("================================");
}