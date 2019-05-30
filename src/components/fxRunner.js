//Requires
const os = require('os');
const { spawn } = require('child_process');
const sleep = require('util').promisify(setTimeout)
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'FXRunner';


module.exports = class FXRunner {
    constructor(config) {
        logOk('::Started', context);
        this.config = config;
        this.fxChild = null;
        this.spawnVariables = null;
        this.outData = '';
        this.enableBuffer = false;
        this.tsChildStarted = null;
        this.setupVariables();

        //The setTimeout is not strictly necessary, but it's nice to have other errors in the top before fxserver starts.
        if(config.autostart){
            setTimeout(() => {
                this.spawnServer();
            }, 1000);
        }
    }


    //================================================================
    /**
     * Setup the spawn variables
     */
    setupVariables(){
        let osType = os.type();
        let onesyncFlag = (this.config.onesync)? '+set onesync_enabled 1' : '';
        if(osType === 'Linux'){
            this.spawnVariables = {
                shell: '/bin/bash',
                cmdArgs: [`${this.config.buildPath}/run.sh`, `${onesyncFlag} +exec ${this.config.cfgPath}`]
            };
        }else if(osType === 'Windows_NT'){
            this.spawnVariables = {
                shell: 'cmd.exe',
                cmdArgs: ['/c', `${this.config.buildPath}/run.cmd ${onesyncFlag} +exec ${this.config.cfgPath}`]
            };
        }else{
            logError(`OS type not supported: ${osType}`, context);
            process.exit(1);
        }

    }//Final setupVariables()

    
    //================================================================
    /**
     * Spawns the FXServer and sets up all the event handlers
     */
    async spawnServer(){
        //Sanity Check
        if(
            this.spawnVariables == null || 
            typeof this.spawnVariables.shell == 'undefined' || 
            typeof this.spawnVariables.cmdArgs == 'undefined'
        ){
            logError('this.spawnVariables is not set.', context);
            return false;
        }
        if(this.fxChild !== null){
            logError('this.fxChild is not null.', context);
            return false;
        }

        //Starting server
        try {
            this.fxChild = spawn(
                this.spawnVariables.shell, 
                this.spawnVariables.cmdArgs,
                {cwd: this.config.basePath}
            );
            logOk(`::Server started with PID ${this.fxChild.pid}!`, context);
            this.tsChildStarted = Math.round(Date.now()/1000);
        } catch (error) {
            logError('Failed to start FXServer with the following error:');
            dir(error);
            process.exit(0);
        }
        
        //Pipping stdin and stdout
        this.fxChild.stdout.pipe(process.stdout);
        //FIXME: might disable the stdin pipe when the live console is fully working
        process.stdin.pipe(this.fxChild.stdin);

        //Setting up event handlers
        this.fxChild.on('close', function (code, signal) {
            logWarn('close: ' + `code ${code} and signal ${signal}`, context);
        });
        this.fxChild.on('disconnect', function () {
            logWarn('fxChild disconnect event', context);
        });
        this.fxChild.on('error', function (err) {
            logWarn('fxChild error event:', context);
            dir(err)
        });
        this.fxChild.on('exit', function (code, signal) {
            logWarn('fxChild process exited with ' + `code ${code} and signal ${signal}`, context);
        });
        this.fxChild.stderr.on('data', (data) => {
            logWarn(`========:\n${data}\n========`, context);
        });
        this.fxChild.stdin.on('data', (data) => {
            logWarn(`========:\n${data}\n========`, context);
        });
        this.fxChild.stdout.on('data', (data) => {
            globals.webConsole.broadcast(data);
            if(this.enableBuffer) this.outData += data;
        });
    }//Final spawnServer()


    //================================================================
    /**
     * Restarts the FXServer
     */
    async restartServer(){
        this.killServer();
        await sleep(1000);
        this.spawnServer();
    }
    

    //================================================================
    /**
     * Kills the FXServer
     */
    killServer(){
        try {
            this.fxChild.kill();
            this.fxChild = null;
            return true;
        } catch (error) {
            logWarn("Couldn't kill the server. Perhaps What Is Dead May Never Die.");
            this.fxChild = null;
            return false;
        }
    }
    

    //================================================================
    /**
     * Pipe a string into FXServer's stdin (aka executes a cfx's command)
     * @param {string} command 
     */
    srvCmd(command){
        if(typeof command !== 'string') throw new Error('Expected String!');
        try {
            let success = this.fxChild.stdin.write(command + "\n");
            globals.webConsole.broadcast(command, true);
            return success;
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
