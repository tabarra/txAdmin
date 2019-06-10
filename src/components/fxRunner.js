//Requires
const { spawn } = require('child_process');
const os = require('os');
const pidtree = require('pidtree');
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
        let onesyncFlag = (this.config.onesync)? '+set onesync_enabled 1' : '';
        if(globals.config.osType === 'Linux'){
            this.spawnVariables = {
                shell: '/bin/bash',
                cmdArgs: [`${this.config.buildPath}/run.sh`, `${onesyncFlag} +exec ${this.config.cfgPath}`]
            };
        }else if(globals.config.osType === 'Windows_NT'){
            this.spawnVariables = {
                shell: 'cmd.exe',
                cmdArgs: ['/c', `${this.config.buildPath}/run.cmd ${onesyncFlag} +exec ${this.config.cfgPath}`]
            };
        }else{
            logError(`OS type not supported: ${globals.config.osType}`, context);
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
            logWarn('>> fxChild close event: ' + `code ${code} and signal ${signal}`, context);
        });
        this.fxChild.on('disconnect', function () {
            logWarn('>> fxChild disconnect event', context);
        });
        this.fxChild.on('error', function (err) {
            logWarn('>> fxChild error event:', context);
            dir(err)
        });
        this.fxChild.on('exit', function (code, signal) {
            logWarn('>> fxChild process exited with ' + `code ${code} and signal ${signal}`, context);
        });
        this.fxChild.stderr.on('data', (data) => {
            logWarn(`\n========\n${data}\n========`, `${context}:stderr:data`);
        });
        this.fxChild.stdin.on('data', (data) => {
            logWarn(`\n========\n${data}\n========`, `${context}:stdin:data`);
        });

        this.fxChild.stdin.on('error', (data) => {});
        this.fxChild.stdin.on('data', (data) => {});

        this.fxChild.stdout.on('error', (data) => {});
        this.fxChild.stdout.on('data', (data) => {
            globals.webConsole.broadcast(data);
            if(this.enableBuffer) this.outData += data;
        });

        this.fxChild.stderr.on('error', (data) => {});
        this.fxChild.stderr.on('data', (data) => {
            logWarn(`========\n${data}\n========`, context);
        });

        //Setting up process priority
        setTimeout(() => {
            this.setProcPriority();
        }, 2500);

        //Setting FXServer variables
        //NOTE: executing this only once might not be as reliable
        setTimeout(async () => {
            this.setFXServerEnvVars();
        }, 5000);
        
    }//Final spawnServer()


    //================================================================
    /**
     * Sets up FXServer scripting environment variables
     */
    async setFXServerEnvVars(){
        log('Setting up FXServer scripting environment variables.', context);

        let delay = 150;
        let version = (globals.version && globals.version.current)? globals.version.current : '--';

        this.srvCmd(`sets FXAdmin-version ${version}`); 
        await sleep(delay);
        this.srvCmd(`set FXAdmin-version ${version}`);
        await sleep(delay);
        this.srvCmd(`set FXAdmin-port ${globals.webServer.config.port}`);
    }


    //================================================================
    /**
     * Sets the process priority to all fxChild (cmd/bash) children (fxserver)
     */
    async setProcPriority(){
        //Sanity check
        if(this.config.setPriority === 'NORMAL') return;
        let priorities = ['LOW', 'BELOW_NORMAL', 'NORMAL', 'ABOVE_NORMAL', 'HIGH', 'HIGHEST'];
        if(!priorities.includes(this.config.setPriority)){
            logWarn(`Couldn't set the processes priority. Invalid priority value. (Use one of these: ${priorities.join()})`, context);
            return;
        }
        if(!this.fxChild.pid){
            logWarn(`Couldn't set the processes priority. Unknown PID.`, context);
            return;
        }

        //Get children and set priorities
        try {
            let pids = await pidtree(this.fxChild.pid);
            pids.forEach(pid => {
                os.setPriority(pid, os.constants.priority['PRIORITY_'+this.config.setPriority]);
            });
            log(`Priority set ${this.config.setPriority} for processes ${pids.join()}`, context)
        } catch (error) {
            logWarn("Couldn't set the processes priority.", context);
            if(globals.config.verbose) dir(error);
        }
    }


    //================================================================
    /**
     * Restarts the FXServer
     */
    async restartServer(reason){
        if(typeof reason === 'string'){
            this.srvCmd(`say Restarting server (${reason}).`);
            await sleep(500);
        }
        this.killServer();
        await sleep(750);
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
            logWarn("Couldn't kill the server. Perhaps What Is Dead May Never Die.", context);
            if(globals.config.verbose) dir(error);
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
            if(globals.config.verbose){
                logError('Error writing to fxChild.stdin', context);
                dir(error);
            }
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
