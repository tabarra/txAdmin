//Requires
const axios = require("axios");
const bigInt = require("big-integer");
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const hostCPUStatus = require('../extras/hostCPUStatus');
const TimeSeries = require('../extras/timeSeries');
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
        this.cpuStatusProvider = new hostCPUStatus();
        this.timeSeries = new TimeSeries(`${globals.config.serverProfilePath}/data/players.json`, 10, 60*60*24);
        this.lastAutoRestart = null;
        this.failCounter = 0;
        this.fxServerHitches = [];
        this.statusServer = {
            online: false,
            ping: false,
            players: []
        }

        //Cron functions
        this.cronFunc = setInterval(() => {
            this.refreshServerStatus();
        }, this.config.interval);
        setInterval(() => {
            if(Array.isArray(this.config.restarter.schedule)){
                this.checkRestartSchedule();
            }
        }, 1*1000);
    }


    //================================================================
    /**
     * Refresh fxRunner configurations
     */
    refreshConfig(){
        this.config = globals.configVault.getScoped('monitor');

        //Reset Cron functions
        clearInterval(this.cronFunc);
        this.cronFunc = setInterval(() => {
            this.refreshServerStatus();
        }, this.config.interval);
    }//Final refreshConfig()


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
            globals.logger.append(`[MONITOR] ${message}`);
            globals.fxRunner.restartServer(reason);
        }else{
            if(globals.config.verbose) logWarn(`(Cooldown: ${elapsed}/${this.config.restarter.cooldown}s) restartFXServer() awaiting restarter cooldown.`, context);
        }
    }


    //================================================================
    processFXServerHitch(hitchTime){
        let hitch = {
            ts: Math.round(Date.now()/1000),
            hitchTime: parseInt(hitchTime)
        }
        this.fxServerHitches.push(hitch);

        //The minimum time for a hitch is 150ms. 60000/150=400
        if (this.fxServerHitches>400) this.fxServerHitches.shift();
    }


    //================================================================
    clearFXServerHitches(){
        this.fxServerHitches = [];
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
            if(globals.config.verbose || this.failCounter > 5){
                logWarn(`(Counter: ${this.failCounter}/${this.config.restarter.failures}) HealthCheck request error: ${error.message}`, context);
            }
            if(this.config.restarter !== false && this.failCounter >= this.config.restarter.failures) this.restartFXServer('Failure Count Above Limit');
            this.statusServer = {
                online: false,
                ping: false,
                players: []
            }
            this.timeSeries.add(0);
            return;
        }
        this.failCounter = 0;

        //Remove endpoint and add steam profile link
        players.forEach(player => {
            player.steam = false;
            player.identifiers.forEach((identifier) => {
                if(identifier.startsWith('steam:')){
                    try {
                        let decID = new bigInt(identifier.slice(6), 16).toString(); 
                        player.steam = `https://steamcommunity.com/profiles/${decID}`;
                    } catch (error) {}
                }
            });
            delete player.endpoint;
        });

        //Save cache and print output
        this.statusServer = {
            online: true,
            ping: Date.now() - timeStart,
            players: players
        }
        this.timeSeries.add(players.length);
        if(globals.config.verbose) log(`Players online: ${players.length}`, context);
    }


} //Fim Monitor()
