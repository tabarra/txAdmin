//Requires
const { spawn } = require('child_process');
const sleep = require('util').promisify(setTimeout)
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'FXRunner';


module.exports = class FXRunner {
    constructor(config) {
        this.config = config;
        this.fxChild = null;
        this.fxChildStatus = null;
        this.outData = '';
        this.enableBuffer = false;
        if(config.autostart) this.spawnServer();
    }

    
    //================================================================
    /**
     * Spawns the FXServer and sets up all the event handlers
     */
    async spawnServer(){
        this.fxChild = spawn(
            "cmd.exe", 
            ['/c', `${this.config.serverPath}/run.cmd +exec ${this.config.cfgPath}`],
            {cwd: this.config.resPath}
        );
        logOk(`::Iniciado com PID ${this.fxChild.pid}!`, context);
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
            logError('this.fxChild process exited with ' + `code ${code} and signal ${signal}`, context);
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
            if(this.enableBuffer) this.outData += data;
        });
    }//Final spawnServer()


    //================================================================
    /**
     * Restarts the FXServer
     */
    async restartServer(){
        this.fxChild.kill();
        cleanTerminal();
        await sleep(1000);
        this.spawnServer();
    }
    

    //================================================================
    /**
     * Kills the FXServer
     */
    killServer(){
        this.fxChild.kill();
        cleanTerminal();
    }
    

    //================================================================
    /**
     * Pipe a string into FXServer's stdin (aka executes a cfx's command)
     * @param {string} command 
     */
    srvCmd(command){
        if(typeof command !== 'string') throw new Error('Expected String!');
        try {
            return this.fxChild.stdin.write(command + "\n");
        } catch (error) {
            return false;
        }
    }
    

    //================================================================
    /**
     * Pipe a string into FXServer's stdin (aka executes a cfx's command) and returns the stdout output.
     * @param {*} command
     * @param {*} bufferTime the size of the buffer in milliseconds
     * @returns {string} buffer
     */
    async srvCmdBuffer(command, bufferTime){
        if(typeof command !== 'string') throw new Error('Expected String!');
        bufferTime = (bufferTime !== undefined)? bufferTime : 1500;
        this.outData = '';
        this.enableBuffer = true;
        let result = this.srvCmd(command);
        if(!result) return false;
        await sleep(bufferTime);
        this.enableBuffer = false;
        return this.outData;
    }
} //Fim FXRunner()
