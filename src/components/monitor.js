//Requires
const axios = require("axios");
const bigInt = require("big-integer");
const sleep = require('util').promisify(setTimeout);
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const helpers = require('../extras/helpers');
const HostCPUStatus = require('../extras/hostCPUStatus');
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
        if(
            this.config.restarter.failures !== -1 &&
            this.config.restarter.failures * this.config.interval < 15000
        ){
            logError('The monitor.restarter.failures setting must be 15 seconds or more.', context);
            process.exit();
        }

        //Setting up
        logOk('::Started', context);
        this.cpuStatusProvider = new HostCPUStatus();
        this.timeSeries = new TimeSeries(`${globals.config.serverProfilePath}/data/players.json`, 10, 60*60*24);
        this.lastAutoRestart = null;
        this.failCounter = 0;
        this.lastHeartBeat = 0;
        this.fxServerHitches = [];
        this.schedule = this.buildSchedule();
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
            this.checkRestartSchedule();
        }, 60*1000);
    }


    //================================================================
    /**
     * Refresh fxRunner configurations
     */
    refreshConfig(){
        this.config = globals.configVault.getScoped('monitor');
        this.schedule = this.buildSchedule();

        //Reset Cron functions
        clearInterval(this.cronFunc);
        this.cronFunc = setInterval(() => {
            this.refreshServerStatus();
        }, this.config.interval);
    }//Final refreshConfig()


    //================================================================
    /**
     * Build schedule
     */
    buildSchedule(){
        if(!Array.isArray(this.config.restarter.schedule) || !this.config.restarter.schedule.length){
            return false;;
        }

        let getScheduleObj = (hour, minute, sub) => {
            var date = new Date();
            date.setHours(hour);
            date.setMinutes(minute - sub);

            let remaining = (sub > 1)? `${sub} minutes.` : `${60} seconds. Please disconnect.`;
            return {
                hour: date.getHours(),
                minute: date.getMinutes(),
                message: `${globals.config.serverName} is scheduled to restart in ${remaining}`
            }
        }

        let times = helpers.parseSchedule(this.config.restarter.schedule);
        let schedule = [];
        let announceMinutes = [15, 10, 5, 4, 3, 2, 1];
        times.forEach((time)=>{
            try {
                announceMinutes.forEach((mins)=>{
                    schedule.push(getScheduleObj(time.hour, time.minute, mins));
                })
                schedule.push({
                    hour: time.hour,
                    minute: time.minute,
                    restart: true
                });
            } catch (error) {
                let timeJSON = JSON.stringify(time);
                if(globals.config.verbose) logWarn(`Error building restart schedule for time '${timeJSON}':\n ${error.message}`, context);
            }
        })

        return (schedule.length)? schedule : false;
    }


    //================================================================
    /**
     * Check the restart schedule
     */
    checkRestartSchedule(){
        if(!Array.isArray(this.schedule)) return;
        let now = new Date;
        try {
            //FIXME: returns only the first result, not necessarily the most important
            // eg, when a restart message comes before a restart command
            let action = this.schedule.find((time) => {
                return (time.hour == now.getHours() && time.minute == now.getMinutes())
            });
            if(!action) return;
            if(action.restart === true){
                let currTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
                log(`Scheduled restart: ${currTime}`);
                this.restartFXServer(`scheduled restart at ${currTime}`, 15);
            }else if(typeof action.message === 'string'){
                globals.discordBot.sendAnnouncement(action.message);
                globals.fxRunner.srvCmd(`txaBroadcast "${action.message}"`);
            }
        } catch (error) {}
    }



    //================================================================
    /**
     * Check cooldown and Restart the FXServer
     */
    async restartFXServer(reason, kickTime){
        let elapsed = Math.round(Date.now()/1000) - globals.fxRunner.tsChildStarted;
        if(elapsed >= this.config.restarter.cooldown){
            //sanity check
            if(globals.fxRunner.fxChild === null){
                logWarn('Server not started, no need to restart', context);
                return false;
            }
            let message = `Restarting server (${reason}).`;
            logWarn(message, context);
            globals.discordBot.sendAnnouncement(`Restarting **${globals.config.serverName}** (${reason}).`);
            globals.logger.append(`[MONITOR] ${message}`);
            if(kickTime){
                await globals.fxRunner.srvCmd(`txaKickAll "${message}"`);
                await sleep(kickTime*1000);
            }
            globals.fxRunner.restartServer(reason);
        }else{
            if(globals.config.verbose) logWarn(`(Cooldown: ${elapsed}/${this.config.restarter.cooldown}s) restartFXServer() awaiting restarter cooldown.`, context);
        }
    }


    //================================================================
    //FIXME: temp
    handleHeartBeat(body){
        this.lastHeartBeat = Math.round(Date.now()/1000);
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
        if(globals.fxRunner.fxChild === null || globals.fxRunner.fxServerPort === null){
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
            url: `http://localhost:${globals.fxRunner.fxServerPort}/players.json`,
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

            //Check if it's time to restart the server
            let now = Math.round(Date.now()/1000)
            if(
                this.config.restarter.failures !== -1 &&
                this.failCounter >= this.config.restarter.failures &&
                (now - this.lastHeartBeat) > 30
            ){
                this.restartFXServer('Failure Count Above Limit');
            }
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
