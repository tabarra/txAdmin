//Requires
const axios = require("axios");
const pidusageTree = require('pidusage-tree')
const bigInt = require("big-integer");
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'Monitor';


module.exports = class Monitor {
    constructor(config) {
        this.config = config;

        //Checking config
        if(this.config.interval < 1000){
            logError('The monitor.interval setting must be 1000 milliseconds or more.', context);
            process.exit();
        }
        if(this.config.restarter.failures * this.config.interval < 15000){
            logError('The monitor.restarter.failures setting must be 15 seconds or more.', context);
            process.exit();
        }

        //Setting up
        logOk('::Started', context);
        this.statusProcess = false;
        this.statusAllProcess = false;
        this.lastAutoRestart = null;
        this.failCounter = 0;
        this.statusServer = {
            online: false,
            players: []
        }

        //Cron functions
        setInterval(() => {
            this.refreshServerStatus();
            this.refreshProcessStatus();
        }, this.config.interval);
        if(Array.isArray(this.config.restarter.schedule)){
            setInterval(() => {
                this.checkRestartSchedule();
            }, 1*1000);
        }
    }


    //================================================================
    /**
     * Check the restart schedule 
     */
    checkRestartSchedule(){
        let now = new Date;
        let currTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        if(this.config.restarter.schedule.includes(currTime)){
            this.restartFXServer(`Scheduled restart at ${currTime}`);
        }
    }


    //================================================================
    /**
     * Check cooldown and Restart the FXServer
     */
    restartFXServer(reason){
        let elapsed = Math.round(Date.now()/1000) - globals.fxRunner.tsChildStarted;
        if(elapsed >= this.config.restarter.cooldown){
            //sanity check
            if(globals.fxRunner.fxChild === null){
                logWarn('Server not started, no need to restart', context);
                return false;
            }
            let message = `Restarting server (${reason}).`;
            logWarn(message, context);
            globals.fxRunner.restartServer(message);
        }else{
            if(globals.config.verbose) logWarn(`(Cooldown: ${elapsed}/${this.config.restarter.cooldown}s) restartFXServer() awaiting restarter cooldown.`, context);
        }
    }


    //================================================================
    /**
     * Getter for the status object.
     * @returns {object} object containing .process and .server
     */
    getStatus(){
        return {
            process: this.statusProcess,
            server: this.statusServer,
            extra: {
                allProcesses: this.statusAllProcess,
                configs: {
                    //TODO: todo?
                }
            }
        }
    }


    //================================================================
    /**
     * Refreshes the Server Status.
     */
    async refreshServerStatus(){
        //Check if the server is supposed to be offline
        if(globals.fxRunner.fxChild === null){
            this.statusServer = {
                online: false,
                ping: false,
                players: []
            }
            return;
        }

        //Setup do request e variáveis iniciais
        let timeStart = Date.now()
        let players = [];
        let requestOptions = {
            url: `http://localhost:${globals.config.fxServerPort}/players.json`,
            method: 'get',
            responseType: 'json',
            responseEncoding: 'utf8',
            maxRedirects: 0,
            timeout: this.config.timeout
        }

        //Make request
        try {
            const res = await axios(requestOptions);
            players = res.data;
            if(!Array.isArray(players)) throw new Error("FXServer's players endpoint didnt return a JSON array.")
        } catch (error) {
            this.failCounter++;
            logWarn(`(Counter: ${this.failCounter}/${this.config.restarter.failures}) HealthCheck request error: ${error.message}`, context);
            if(this.config.restarter !== false && this.failCounter >= this.config.restarter.failures) this.restartFXServer('Failure Count Above Limit');
            this.statusServer = {
                online: false,
                ping: false,
                players: []
            }
            return;
        }
        this.failCounter = 0;

        //Remove identifiers and add steam profile link
        players.forEach(player => {
            player.identifiers.forEach((identifier) => {
                if(identifier.startsWith('steam:')){
                    try {
                        let decID = new bigInt(identifier.slice(6), 16).toString(); 
                        player.steam = `https://steamcommunity.com/profiles/${decID}`;
                    } catch (error) {}
                }
            });
            delete player.identifiers;
            delete player.endpoint;
            delete player.id; //Usefull if we are going to kick/ban player. Well, maybe...
        });

        //Save cache and print output
        this.statusServer = {
            online: true,
            ping: Date.now() - timeStart,
            players: players
        }
        if(globals.config.verbose) log(`Players online: ${players.length}`, context);
    }


    //================================================================
    /**
     * Refreshes the Processes Statuses.
     */
    async refreshProcessStatus(){
        //HACK: temporarily disable feature on windows due to performance issues on WMIC
        if(globals.config.osType === 'Windows_NT') return;

        try {
            var processes = await pidusageTree(process.pid);
            // let processes = {}
            let combined = {
                count: 0,
                cpu: 0,
                memory: 0,
                uptime: 0
            }
            let individual = {}

            //Foreach PID
            Object.keys(processes).forEach((pid) => {
                var curr = processes[pid];

                //NOTE: Somehow this might happen in Linux
                if(curr === null) return;

                //combined
                combined.count += 1;
                combined.cpu += curr.cpu;
                combined.memory += curr.memory;
                if(combined.uptime === null || combined.uptime > curr.elapsed) combined.uptime = curr.elapsed;

                //individual
                individual[pid] = {
                    cpu: curr.cpu,
                    memory: curr.memory,
                    uptime: curr.elapsed
                }
            });
            this.statusProcess = combined;
            this.statusAllProcess = individual;
        } catch (error) {
            if(globals.config.verbose){
                logWarn('Error refreshing processes statuses', context);
                dir(error);
            }
            this.statusProcess = false;
            this.statusAllProcess = false;
        }
    }


} //Fim Monitor()
