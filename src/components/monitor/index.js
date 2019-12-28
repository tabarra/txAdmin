//Requires
const axios = require("axios");
const bigInt = require("big-integer");
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../../extras/console');
const helpers = require('../../extras/helpers');
const HostCPUStatus = require('./hostCPUStatus');
const TimeSeries = require('./timeSeries');
const context = 'Monitor';


module.exports = class Monitor {
    constructor(config) {
        this.config = config;

        //Checking config
        if(this.config.restarter.cooldown < 15){
            logError('The monitor.restarter.cooldown setting must be 15 seconds or more.', context);
            process.exit();
        }
        if(this.config.restarter.failures < 15){
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
        this.globalCounters = {
            hitches: [],
            fullCrashes: 0,
            partialCrashes: 0,
        }
        this.schedule = null;
        this.statusServer = {
            online: false,
            ping: false,
            players: []
        }
        this.buildSchedule();

        //Cron functions
        setInterval(() => {
            this.refreshServerStatus();
        }, 1000);
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
        this.buildSchedule();
    }//Final refreshConfig()


    //================================================================
    /**
     * Build schedule
     */
    buildSchedule(){
        if(!Array.isArray(this.config.restarter.schedule) || !this.config.restarter.schedule.length){
            this.schedule = false;
            return;
        }

        let getScheduleObj = (hour, minute, sub) => {
            var date = new Date();
            date.setHours(hour);
            date.setMinutes(minute - sub);

            let tOptions = {
                smart_count: sub,
                servername: globals.config.serverName
            }
            return {
                hour: date.getHours(),
                minute: date.getMinutes(),
                restart: false,
                messages: {
                    chat: globals.translator.t('restarter.schedule_warn', tOptions),
                    discord: globals.translator.t('restarter.schedule_warn_discord', tOptions),
                }
            }
        }

        let times = helpers.parseSchedule(this.config.restarter.schedule);
        let schedule = [];
        let announceMinutes = [30, 15, 10, 5, 4, 3, 2, 1];
        times.forEach((time)=>{
            try {
                announceMinutes.forEach((mins)=>{
                    schedule.push(getScheduleObj(time.hour, time.minute, mins));
                })
                schedule.push({
                    hour: time.hour,
                    minute: time.minute,
                    restart: true,
                    messages: false
                });
            } catch (error) {
                let timeJSON = JSON.stringify(time);
                if(globals.config.verbose) logWarn(`Error building restart schedule for time '${timeJSON}':\n ${error.message}`, context);
            }
        })

        if(globals.config.verbose) schedule.forEach(el => { dir(el.messages) });
        this.schedule = (schedule.length)? schedule : false;
    }


    //================================================================
    /**
     * Check the restart schedule
     */
    checkRestartSchedule(){
        if(!Array.isArray(this.schedule)) return;
        if(globals.fxRunner.fxChild === null) return;

        try {
            //Check schedule for current time
            //FIXME: returns only the first result, not necessarily the most important
            // eg, when a restart message comes before a restart command
            let now = new Date;
            let action = this.schedule.find((time) => {
                return (time.hour == now.getHours() && time.minute == now.getMinutes())
            });
            if(!action) return;

            //Perform scheduled action
            if(action.restart === true){
                let currTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
                this.restartFXServer(
                    `scheduled restart at ${currTime}`,
                    globals.translator.t('restarter.schedule_reason', {time: currTime})
                );
            }else if(action.messages){
                globals.discordBot.sendAnnouncement(action.messages.discord);
                globals.fxRunner.srvCmd(`txaBroadcast "txAdmin" "${action.messages.chat}"`);
            }
        } catch (error) {}
    }



    //================================================================
    /**
     * Check cooldown and Restart the FXServer
     * @param {string} reason
     * @param {string} reasonTranslated
     */
    async restartFXServer(reason, reasonTranslated){
        //sanity check
        if(globals.fxRunner.fxChild === null){
            logWarn('Server not started, no need to restart', context);
            return false;
        }

        //Cooldown check
        let elapsed = Math.round(Date.now()/1000) - globals.fxRunner.tsChildStarted;
        if(elapsed < this.config.restarter.cooldown){
            if(globals.config.verbose) logWarn(`(Cooldown: ${elapsed}/${this.config.restarter.cooldown}s) restartFXServer() awaiting restarter cooldown.`, context);
            return false;
        }

        //Restart server
        let message = `Restarting server (${reason}).`;
        logWarn(message, context);
        globals.logger.append(`[MONITOR] ${message}`);
        globals.fxRunner.restartServer(reasonTranslated);
    }


    //================================================================
    //FIXME: temp
    handleHeartBeat(body){
        this.lastHeartBeat = Math.round(Date.now()/1000);
    }


    //================================================================
    handleFailure(errorMessage){
        let now = Math.round(Date.now()/1000)
        let elapsed = Math.round(Date.now()/1000) - globals.fxRunner.tsChildStarted;

        //Check cooldown
        if(elapsed < this.config.restarter.cooldown){
            if(globals.config.verbose) logWarn(`(Cooldown: ${elapsed}/${this.config.restarter.cooldown}s) Failed to connect to server. Still in cooldown.`, context);
            return false;
        }

        //TODO: check if fxChild is closed, in this case no need to wait the failure count

        //Count failure
        this.failCounter++;
        this.timeSeries.add(0);
        if(globals.config.verbose || this.failCounter > 10){
            logWarn(`(${this.failCounter}/${this.config.restarter.failures}) FXServer is not responding! (${errorMessage})`, context);
        }

        //Check if it's time to restart the server
        if(
            this.config.restarter.failures !== -1 &&
            this.failCounter >= this.config.restarter.failures
        ){
            if((now - this.lastHeartBeat) > 30){
                this.globalCounters.fullCrashes++;
                this.restartFXServer(
                    'server crash detected',
                    globals.translator.t('restarter.crash_detected')
                );
            }else if(this.failCounter === 60*4){ //after 4 minutes
                let tOptions = {
                    servername: globals.config.serverName
                }
                globals.discordBot.sendAnnouncement(globals.translator.t('restarter.partial_crash_warn_discord', tOptions));
                let chatMsg = globals.translator.t('restarter.partial_crash_warn')
                globals.fxRunner.srvCmd(`txaBroadcast "txAdmin" "${chatMsg}"`);
            }else if(this.failCounter === 60*5){ //after 5 minutes
                this.globalCounters.partialCrashes++;
                this.restartFXServer(
                    'server partial crash detected',
                    globals.translator.t('restarter.crash_detected')
                );
            }else{
                if(globals.config.verbose) logWarn(`Above restarter limit for HealthCheck failures. Skipping restart since last HeartBeat was less than 30s ago.`);
            }
        }
    }


    //================================================================
    processFXServerHitch(hitchTime){
        let hitch = {
            ts: Math.round(Date.now()/1000),
            hitchTime: parseInt(hitchTime)
        }
        this.globalCounters.hitches.push(hitch);

        //The minimum time for a hitch is 150ms. 60000/150=400
        if (this.globalCounters.hitches>400) this.globalCounters.hitches.shift();
    }


    //================================================================
    clearFXServerHitches(){
        this.globalCounters.hitches = [];
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
            if(!Array.isArray(players)) throw new Error("FXServer's players endpoint didnt return a JSON array.");
        } catch (error) {
            this.handleFailure(error.message);
            this.statusServer = {
                online: false,
                ping: false,
                players: []
            }
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

        //Save status cache and print output
        this.statusServer = {
            online: true,
            ping: Date.now() - timeStart,
            players: players
        }
        this.timeSeries.add(players.length);
    }


} //Fim Monitor()
