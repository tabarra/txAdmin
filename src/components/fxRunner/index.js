//Requires
const { spawn } = require('child_process');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const sleep = require('util').promisify(setTimeout);
const pidtree = require('pidtree');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../extras/console');
const helpers = require('../../extras/helpers');
const resourceInjector = require('./resourceInjector');
const ConsoleBuffer = require('./consoleBuffer');
const context = 'FXRunner';

//Helpers
const now = () => { return Math.round(new Date() / 1000) };


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
        this.tmpExecFile = path.normalize(process.cwd()+`/${globals.config.serverProfilePath}/data/exec.tmp.cfg`);
        this.setupVariables();

        //The setTimeout is not strictly necessary, but it's nice to have other errors in the top before fxserver starts.
        if(config.autostart){
            setTimeout(() => {
                this.spawnServer(true);
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
                shell: '/bin/sh',
                cmdArgs: [`${this.config.buildPath}/run.sh`, `${onesyncFlag} +exec "${this.tmpExecFile}"`]
            };
        }else if(globals.config.osType === 'Windows_NT'){
            this.spawnVariables = {
                shell: 'cmd.exe',
                cmdArgs: ['/c', `${this.config.buildPath}/run.cmd ${onesyncFlag} +exec "${this.tmpExecFile}"`]
            };
        }else{
            logError(`OS type not supported: ${globals.config.osType}`, context);
            process.exit();
        }

    }//Final setupVariables()


    //================================================================
    /**
     * Spawns the FXServer and sets up all the event handlers
     * @param {boolean} announce
     * @returns {string} null or error message
     */
    async spawnServer(announce){
        log("Starting FXServer", context);
        //Sanity Check
        if(
            this.spawnVariables == null ||
            typeof this.spawnVariables.shell == 'undefined' ||
            typeof this.spawnVariables.cmdArgs == 'undefined'
        ){
            return logError('this.spawnVariables is not set.', context);
        }
        //If the any FXServer configuration is missing
        if(
            this.config.buildPath === null ||
            this.config.basePath === null ||
            this.config.cfgPath === null
        ){
            return logError('Cannot start the server with missing configuration (buildPath || basePath || cfgPath).', context);
        }
        //If the server is already alive
        if(this.fxChild !== null){
            return logError('The server is already started.', context);
        }

        //Refresh resource cache
        await this.injectResources();

        //Write tmp exec file
        let execFilePath = await this.writeExecFile(false, true);
        if(!execFilePath) return logError('Failed to write exec file. Check terminal.', context);

        //Detecting endpoint port
        try {
            let cfgFilePath = helpers.resolveCFGFilePath(this.config.cfgPath, this.config.basePath);
            let rawCfgFile = helpers.getCFGFileData(cfgFilePath);
            this.fxServerPort = helpers.getFXServerPort(rawCfgFile);
        } catch (error) {
            let errMsg =  logError(`FXServer config error: ${error.message}`, context);
            //the IF below is only a way to disable the endpoint check
            if(globals.config.forceFXServerPort){
                this.fxServerPort = globals.config.forceFXServerPort;
            }else{
                return errMsg;
            }
        }

        //Sending header to the console buffer
        this.consoleBuffer.writeHeader();

        //Resseting hitch counter
        globals.monitor.clearFXServerHitches();

        //Announcing
        if(announce === 'true' | announce === true){
            let discordMessage = globals.translator.t('server_actions.spawning_discord', {servername: globals.config.serverName});
            globals.discordBot.sendAnnouncement(discordMessage);
        }

        //Starting server
        let pid;
        let tsStart = now();
        try {
            this.fxChild = spawn(
                this.spawnVariables.shell,
                this.spawnVariables.cmdArgs,
                {cwd: this.config.basePath}
            );
            pid = this.fxChild.pid.toString();
            logOk(`:: [${pid}] FXServer Started!`, context);
            this.tsChildStarted = tsStart;
        } catch (error) {
            logError('Failed to start FXServer with the following error:');
            dir(error);
            process.exit(0);
        }

        //Setting up stream handlers
        this.fxChild.stdout.setEncoding('utf8');
        //process.stdin.pipe(this.fxChild.stdin);

        //Setting up event handlers
        this.fxChild.on('close', function (code, signal) {
            logWarn(`>> [${pid}] FXServer Closed. (code ${code})`, context);
        });
        this.fxChild.on('disconnect', function () {
            logWarn(`>> [${pid}] FXServer Disconnected.`, context);
        });
        this.fxChild.on('error', function (err) {
            logWarn(`>> [${pid}] FXServer Errored:`, context);
            dir(err)
        });
        this.fxChild.on('exit', function (code, signal) {
            process.stdout.write("\n"); //Make sure this isn't concatenated with the last line
            logWarn(`>> [${pid}] FXServer Exited.`, context);
            if(now() - tsStart <= 5){
                setTimeout(() => {
                    if(globals.config.osType === 'Windows_NT'){
                        logWarn(`FXServer didn't started. This is not an issue with txAdmin. Make sure you have Visual C++ 2019 installed.`, context)
                    }else{
                        logWarn(`FXServer didn't started. This is not an issue with txAdmin.`, context)
                    }
                }, 500);
            }
        });

        this.fxChild.stdin.on('error', (data) => {});
        this.fxChild.stdin.on('data', (data) => {});

        this.fxChild.stdout.on('error', (data) => {});
        this.fxChild.stdout.on('data', this.consoleBuffer.write.bind(this.consoleBuffer));

        this.fxChild.stderr.on('error', (data) => {});
        this.fxChild.stderr.on('data', this.consoleBuffer.writeError.bind(this.consoleBuffer));

        //Setting up process priority
        setTimeout(() => {
            this.setProcPriority();
        }, 2500);

        return null;
    }//Final spawnServer()


    //================================================================
    /**
     * Inject the txAdmin resources
     */
    async injectResources(){
        try {
            let reset = await resourceInjector.resetCacheFolder(this.config.basePath);
            this.extResources = resourceInjector.getResourcesList(this.config.basePath);
            let inject = await resourceInjector.inject(this.config.basePath, this.extResources);
        } catch (error) {
            logError(`ResourceInjector Error: ${error.message}`, context);
            return false;
        }
    }


    //================================================================
    /**
     * Writes the exec.tmp.cfg file
     * @param {boolean} refresh
     * @param {boolean} start
     */
    async writeExecFile(refresh = false, start = false){
        log('Setting up FXServer temp exec file.', context);

        //FIXME: experiment
        let isEnabled;
        try {
            let dbo = globals.database.getDB();
            isEnabled = await dbo.get("experiments.bans.enabled").value();
        } catch (error) {
            logError(`[writeExecFile] Database operation failed with error: ${error.message}`, context);
            if(globals.config.verbose) dir(error);
        }
        let runExperiment = (isEnabled)? 'true' : 'false';

        //Defaults
        let timestamp = new Date().toLocaleString();
        let toExec = [
            `# [${timestamp}] This file was auto-generated by txAdmin`,
            `sets txAdmin-version "${globals.version.current}"`,
            `set txAdmin-apiPort "${globals.webServer.config.port}"`,
            `set txAdmin-apiToken "${globals.webServer.intercomToken}"`,
            `set txAdmin-clientCompatVersion "1.5.0"`,
            `set txAdmin-expBanEnabled ${runExperiment}`
        ]

        //Commands
        this.extResources.forEach((res)=>{
            toExec.push(`ensure "${res}"`);
        });

        if(refresh) toExec.push('refresh');
        if(start) toExec.push(`exec "${this.config.cfgPath}"`);

        try {
            await fs.writeFile(this.tmpExecFile, toExec.join('\n'), 'utf8');
            return this.tmpExecFile;
        } catch (error) {
            logError(`Error while writing tmp exec file for the FXServer: ${error.message}`, context);
            return false;
        }
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
     * @param {string} tReason
     */
    async restartServer(tReason){
        try {
            //If a reason is provided, announce restart on discord, kick all players and wait 500ms
            if(typeof tReason === 'string'){
                let tOptions = {
                    servername: globals.config.serverName,
                    reason: tReason
                }
                let discordMessage = globals.translator.t('server_actions.restarting_discord', tOptions);
                globals.discordBot.sendAnnouncement(discordMessage);
                let kickMessage = globals.translator.t('server_actions.restarting', tOptions).replace(/\"/g, '\\"');
                this.srvCmd(`txaKickAll "${kickMessage}"`);
                await sleep(500);
            }

            //Restart server
            this.killServer();
            await sleep(1250);
            return this.spawnServer();
        } catch (error) {
            let errMsg = logError("Couldn't restart the server.", context);
            if(globals.config.verbose) dir(error);
            return errMsg;
        }
    }


    //================================================================
    /**
     * Kills the FXServer
     * @param {string} tReason
     */
    async killServer(tReason){
        try {
            //If a reason is provided, announce restart on discord, kick all players and wait 500ms
            if(typeof tReason === 'string'){
                let tOptions = {
                    servername: globals.config.serverName,
                    reason: tReason
                }
                let discordMessage = globals.translator.t('server_actions.stopping_discord', tOptions);
                globals.discordBot.sendAnnouncement(discordMessage);
                let kickMessage = globals.translator.t('server_actions.stopping', tOptions).replace(/\"/g, '\\"');
                this.srvCmd(`txaKickAll "${kickMessage}"`);
                await sleep(500);
            }

            //Stopping server
            this.fxChild.kill();
            this.fxChild = null;
            return true;
        } catch (error) {
            logError("Couldn't kill the server. Perhaps What Is Dead May Never Die.", context);
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
            globals.webConsole.buffer(command, 'command');
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
