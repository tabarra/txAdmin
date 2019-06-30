//Requires
const { spawn } = require('child_process');
const os = require('os');
const pidtree = require('pidtree');
const StreamSnitch = require('stream-snitch');
const sleep = require('util').promisify(setTimeout);
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
            }, config.autostartDelay * 1000);
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
            process.exit();
        }

    }//Final setupVariables()

    
    //================================================================
    /**
     * Spawns the FXServer and sets up all the event handlers
     */
    async spawnServer(){
        logWarn("Starting FXServer", context);
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
            logOk(`::FXServer started with PID ${this.fxChild.pid}!`, context);
            this.tsChildStarted = Math.round(Date.now()/1000);
        } catch (error) {
            logError('Failed to start FXServer with the following error:');
            dir(error);
            process.exit(0);
        }
        
        //Setting up stream handlers
        let hitchStreamProcessor = new StreamSnitch(
            /hitch warning: frame time of (\d{3,5}) milliseconds/g,
            (m) => {
                try {
                    globals.monitor.processFXServerHitch(m[1])
                }catch(e){}
            }
        );
        //FIXME: temp handler
        let detectMissingResource = new StreamSnitch(
            /Couldn't find resource txAdminClient./g,
            (m) => {
                try {
                    globals.resourceNotFound = true;
                }catch(e){}
            }
        );
        //NOTE: e se ao invés de pipe, eu der só um console log pra evitar os SIGINT?
        this.fxChild.stdout.setEncoding('utf8');
        if(!this.config.quiet) this.fxChild.stdout.pipe(process.stdout, {end: false});
        this.fxChild.stdout.pipe(hitchStreamProcessor);
        this.fxChild.stdout.pipe(detectMissingResource);
        //NOTE: might disable the stdin pipe in the future, you should use the live console
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

        this.fxChild.stdin.on('error', (data) => {});
        this.fxChild.stdin.on('data', (data) => {});

        this.fxChild.stdout.on('error', (data) => {});
        this.fxChild.stdout.on('data', this.fxserverOutputHandler.bind(this));

        this.fxChild.stderr.on('error', (data) => {});
        this.fxChild.stderr.on('data', (data) => {
            logWarn(`\n========\n${data}\n========`, `${context}:stderr:data`);
        });

        hitchStreamProcessor.on('error', (data) => {});

        //Setting up process priority
        setTimeout(() => {
            this.setProcPriority();
        }, 2500);

        //Setting FXServer variables
        //NOTE: executing this only once might not be as reliable
        setTimeout(async () => {
            this.setFXServerEnvVars();
        }, 3000);
        
    }//Final spawnServer()


    //================================================================
    /**
     * Sets up FXServer scripting environment variables
     */
    async setFXServerEnvVars(){
        log('Setting up FXServer scripting environment variables.', context);
        
        let delay = 150;
        this.srvCmd(`sets txAdmin-version ${globals.version.current}`); 
        await sleep(delay);
        this.srvCmd(`set txAdmin-version ${globals.version.current}`);
        await sleep(delay);
        this.srvCmd(`set txAdmin-clientCompatVersion "1.0.0"`);
        await sleep(delay);
        this.srvCmd(`ensure txAdminClient`);
    }


    //================================================================
    /**
     * Sets the process priority to all fxChild (cmd/bash) children (fxserver)
     */
    async setProcPriority(){
        //Sanity check
        if(typeof this.config.setPriority !== 'string') return;
        let priority = this.config.setPriority.toUpperCase();

        if(priority === 'NORMAL') return;
        let validPriorities = ['LOW', 'BELOW_NORMAL', 'NORMAL', 'ABOVE_NORMAL', 'HIGH', 'HIGHEST'];
        if(!validPriorities.includes(priority)){
            logWarn(`Couldn't set the processes priority: Invalid priority value. (Use one of these: ${validPriorities.join()})`, context);
            return;
        }
        if(!this.fxChild.pid){
            logWarn(`Couldn't set the processes priority: Unknown PID.`, context);
            return;
        }

        //Get children and set priorities
        try {
            let pids = await pidtree(this.fxChild.pid);
            pids.forEach(pid => {
                os.setPriority(pid, os.constants.priority['PRIORITY_'+priority]);
            });
            log(`Priority set ${priority} for processes ${pids.join()}`, context)
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
            reason = reason.replace(/\"/g, '\\"');
            this.srvCmd(`txaBroadcast "Restarting server (${reason})."`);
            await sleep(100);
        }
        this.killServer();
        globals.monitor.clearFXServerHitches()
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
            globals.webConsole.bufferCommand(command);
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


    //================================================================
    /**
     * FXServers output handler
     * @param {string} data
     */
    async fxserverOutputHandler(data){
        // const chalk = require('chalk');
        // process.stdout.write(chalk.bold.red('|'));
        // process.stdout.write(data.replace(/[\x00-\x08\x0B-\x1F\x7F-\x9F\x80-\x9F]/g, ""));
        data = data.toString();
        globals.webConsole.buffer(data);
        if(this.enableBuffer) this.outData += data;
    }


} //Fim FXRunner()
