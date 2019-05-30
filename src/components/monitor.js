//Requires
const axios = require("axios");
const pidusageTree = require('pidusage-tree')
const bigInt = require("big-integer");
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'Monitor';


module.exports = class Monitor {
    constructor(config) {
        logOk('::Started', context);
        this.config = config;
        this.statusProcess = false;
        this.statusAllProcess = false;
        this.lastAutoRestart = null;
        this.failCounter = 0;
        this.statusServer = {
            online: false,
            players: []
        }

        //Função Cron
        setInterval(() => {
            this.refreshServerStatus();
            this.refreshProcessStatus();
            // logError("Data:\n"+JSON.stringify(this.getStatus(), null, 2));
        }, this.config.interval);
    }


    //================================================================
    /**
     * Check the restart schedule 
     */
    checkRestartSchedule(){

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
            globals.fxRunner.srvCmd(`say ${message}`);
            globals.fxRunner.restartServer();
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
            if(this.failCounter >= this.config.restarter.failures) this.restartFXServer('Failure Count Above Limit');
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
        try {
            var processes = await pidusageTree(process.pid);
            let combined = {
                count: 0,
                cpu: 0,
                memory: 0,
                uptime: null
            }
            let individual = {}

            //Foreach PID
            Object.keys(processes).forEach((pid) => {
                var curr = processes[pid];

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
