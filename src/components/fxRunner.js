//Requires
const { spawn } = require('child_process');
const os = require('os');
const pidtree = require('pidtree');
const sleep = require('util').promisify(setTimeout);
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const ConsoleBuffer = require('../extras/consoleBuffer');
const resourceInjector = require('../extras/resourceInjector');
const helpers = require('../extras/helpers');
const context = 'FXRunner';


module.exports = class FXRunner {
    constructor(config) {
        logOk('::Started', context);
        this.config = config;
        this.spawnVariables = null;
        this.fxChild = null;
        this.tsChildStarted = null;
        this.fxServerPort = null;
        this.extResources = [];
        this.consoleBuffer = new ConsoleBuffer(this.config.logPath, 10);
        this.setupVariables();

        //The setTimeout is not strictly necessary, but it's nice to have other errors in the top before fxserver starts.
        if(config.autostart){
            setTimeout(() => {
                this.spawnServer();
                globals.discordBot.sendAnnouncement(`Starting server **${globals.config.serverName}**.`);
            }, config.autostartDelay * 1000);
        }
    }


    //================================================================
    /**
     * Refresh fxRunner configurations
     */
    refreshConfig(){
        this.config = globals.configVault.getScoped('fxRunner');
        this.setupVariables();
    }//Final refreshConfig()


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
        //FIXME: remove this line
        globals.resourceWrongVersion = null;

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
        //If the any FXServer configuration is missing
        if(
            this.config.buildPath === null ||
            this.config.basePath === null ||
            this.config.cfgPath === null
        ){
            logError('Cannot start the server with missing configuration (buildPath || basePath || cfgPath).', context);
            return false;
        }
        //If the server is already alive
        if(this.fxChild !== null){
            logError('The server is already started.', context);
            return false;
        }

        //Refresh resource cache
        await this.injectResources();

        //Detecting endpoint port
        try {
            let rawCfgFile = helpers.getCFGFile(this.config.cfgPath, this.config.basePath);
            this.fxServerPort = helpers.getFXServerPort(rawCfgFile);
        } catch (error) {
            logError(`FXServer config error: ${error.message}`, context);
            //the IF below is only a way to disable the endpoint check
            if(globals.config.forceFXServerPort){
                this.fxServerPort = globals.config.forceFXServerPort;
            }else{
                return false;
            }
        }

        //Sending header to the console buffer
        this.consoleBuffer.writeHeader();

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
        this.fxChild.stdout.setEncoding('utf8');
        //if(!this.config.quiet) this.fxChild.stdout.pipe(process.stdout, {end: false});
        //process.stdin.pipe(this.fxChild.stdin);

        //Setting up event handlers
        this.fxChild.on('close', function (code, signal) {
            logWarn(`>> fxChild close event: code ${code} and signal ${signal}`, context);
        });
        this.fxChild.on('disconnect', function () {
            logWarn('>> fxChild disconnect event', context);
        });
        this.fxChild.on('error', function (err) {
            logWarn('>> fxChild error event:', context);
            dir(err)
        });
        this.fxChild.on('exit', function (code, signal) {
            logWarn(`>> fxChild exit event: code ${code} and signal ${signal}`, context);
        });

        this.fxChild.stdin.on('error', (data) => {});
        this.fxChild.stdin.on('data', (data) => {});

        this.fxChild.stdout.on('error', (data) => {});
        this.fxChild.stdout.on('data', this.consoleBuffer.write.bind(this.consoleBuffer));

        this.fxChild.stderr.on('error', (data) => {});
        this.fxChild.stderr.on('data', (data) => {
            logWarn(`\n========\n${data}\n========`, `${context}:stderr:data`);
        });


        //Setting up process priority
        setTimeout(() => {
            this.setProcPriority();
        }, 2500);

        //Setting FXServer variables
        //NOTE: executing this only once might not be as reliable
        setTimeout(async () => {
            this.setFXServerEnv();
        }, 3000);

    }//Final spawnServer()


    //================================================================
    /**
     * Inject the txAdmin resources
     */
    async injectResources(){
        try {
            let reset = resourceInjector.resetCacheFolder(this.config.basePath);
            this.extResources = resourceInjector.getResourcesList(this.config.basePath);
            let inject = await resourceInjector.inject(this.config.basePath, this.extResources);
        } catch (error) {
            logError(`ResourceInjector Error: ${error.message}`, context);
            return false;
        }
    }


    //================================================================
    /**
     * Sets up FXServer scripting environment variables
     */
    async setFXServerEnv(){
        log('Setting up FXServer scripting environment variables.', context);

        //Defaults
        let toExec = [
            `sets txAdmin-version "${globals.version.current}"`,
            `set txAdmin-version "${globals.version.current}"`,
            `set txAdmin-apiPort "${globals.webServer.config.port}"`,
            `set txAdmin-apiToken "${globals.webServer.intercomToken}"`,
            `set txAdmin-clientCompatVersion "1.1.0"`
        ]

        //Commands
        this.extResources.forEach((res)=>{
            toExec.push(`ensure "${res}"`);
        });

        //Execute
        toExec.forEach(async (cmd)=>{
            this.srvCmd(cmd);
            await sleep(75);
        });
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
        if(this.fxChild === null) return false;
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
        if(this.fxChild === null) return false;
        bufferTime = (bufferTime !== undefined)? bufferTime : 1500;
        this.consoleBuffer.cmdBuffer = '';
        this.consoleBuffer.enableCmdBuffer = true;
        let result = this.srvCmd(command);
        if(!result) return false;
        await sleep(bufferTime);
        this.consoleBuffer.enableCmdBuffer = false;
        return this.consoleBuffer.cmdBuffer;
    }

} //Fim FXRunner()
