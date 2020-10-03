//Requires
const modulename = 'Monitor';
const axios = require("axios");
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const helpers = require('../../extras/helpers');
const HostCPUStatus = require('./hostCPUStatus');
const TimeSeries = require('./timeSeries');

//Helpers
const now = () => { return Math.round(Date.now() / 1000) };
const isUndefined = (x) => { return (typeof x === 'undefined') };

module.exports = class Monitor {
    constructor(config) {
        this.config = config;

        //Checking config validity
        if(this.config.timeout > 5000) throw new Error('The monitor.timeout setting must be 5000ms or lower.');
        if(this.config.cooldown < 15) throw new Error('The monitor.cooldown setting must be 15 seconds or higher.');
        if(this.config.healthCheck.failThreshold < 10) throw new Error('The monitor.healthCheck.failThreshold setting must be 10 or higher.');
        if(this.config.healthCheck.failLimit < 180) throw new Error('The monitor.healthCheck.failLimit setting must be 180 or higher.');
        if(this.config.heartBeat.failThreshold < 10) throw new Error('The monitor.heartBeat.failThreshold setting must be 10 or higher.');
        if(this.config.heartBeat.failLimit < 30) throw new Error('The monitor.heartBeat.failLimit setting must be 30 or higher.');

        //Setting up
        logOk('Started');
        this.cpuStatusProvider = new HostCPUStatus();
        this.timeSeries = new TimeSeries(`${globals.info.serverProfilePath}/data/players.json`, 10, 60*60*24);
        this.schedule = null;
        this.globalCounters = {
            hitches: [],
            fullCrashes: 0,
            partialCrashes: 0,
        }
        this.resetMonitorStats();
        this.buildSchedule();

        //Cron functions
        setInterval(() => {
            this.sendHealthCheck();
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
        if(!Array.isArray(this.config.restarterSchedule) || !this.config.restarterSchedule.length){
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

        let times = helpers.parseSchedule(this.config.restarterSchedule);
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
                if(GlobalData.verbose) logWarn(`Error building restart schedule for time '${timeJSON}':\n ${error.message}`);
            }
        })

        if(GlobalData.verbose) dir(schedule.map(el => { return el.messages }));
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
            //NOTE: returns only the first result, not necessarily the most important
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
                if(!this.config.disableChatWarnings){
                    globals.fxRunner.srvCmd(`txaBroadcast "txAdmin" "${action.messages.chat}"`);
                }
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
            logWarn('Server not started, no need to restart');
            return false;
        }

        //Restart server
        let message = `Restarting server (${reason}).`;
        logWarn(message);
        globals.logger.append(`[MONITOR] ${message}`);
        globals.fxRunner.restartServer(reasonTranslated);
    }


    //================================================================
    /**
     * Processes a server hitch
     * NOTE: The minimum time for a hitch is 150ms. 60000/150=400
     * 
     * @param {string} thread //not being used
     * @param {number} hitchTime 
     */
    processFXServerHitch(thread, hitchTime){
        this.globalCounters.hitches.push({
            ts: now(),
            hitchTime: parseInt(hitchTime)
        });

        if(this.globalCounters.hitches>400) this.globalCounters.hitches.shift();
    }


    //================================================================
    resetMonitorStats(){
        this.globalCounters.hitches = [];

        this.currentStatus = 'OFFLINE' // options: OFFLINE, ONLINE, PARTIAL
        this.lastSuccessfulHealthCheck = null; //to see if its above limit
        this.lastStatusWarningMessage = null; //to prevent spamming 
        this.lastSuccessfulHeartBeat = null; //to see if its above limit
        this.lastHealthCheckErrorMessage = null; //to print warning
        this.healthCheckRestartWarningIssued = false; //to prevent spamming 

        //to reset active player list (if module is already loaded)
        if(globals.playerController) globals.playerController.processHeartBeat([]); 
    }


    //================================================================
    async sendHealthCheck(){
        //Check if the server is supposed to be offline
        if(globals.fxRunner.fxChild === null || globals.fxRunner.fxServerPort === null) return;

        //Setup do request e variáveis iniciais
        let requestOptions = {
            url: `http://localhost:${globals.fxRunner.fxServerPort}/dynamic.json`,
            method: 'get',
            responseType: 'json',
            responseEncoding: 'utf8',
            maxRedirects: 0,
            timeout: this.config.timeout
        }

        //Make request
        try {
            const res = await axios(requestOptions);
            if(typeof res.data !== 'object') throw new Error("FXServer's dynamic endpoint didn't return a JSON object.");
            if(isUndefined(res.data.hostname) || isUndefined(res.data.clients)) throw new Error("FXServer's dynamic endpoint didn't return complete data.");
        } catch (error) {
            this.lastHealthCheckErrorMessage = error.message;
            return;
        }
        
        //Set variables
        this.healthCheckRestartWarningIssued = false;
        this.lastHealthCheckErrorMessage = false;
        this.lastSuccessfulHealthCheck = now();
    }


    //================================================================
    /**
     * Refreshes the Server Status and calls for a restart if neccessary.
     *  - HealthCheck: performing an GET to the /dynamic.json file
     *  - HeartBeat: receiving an intercom POST from txAdminClient containing playerlist 
     */
    refreshServerStatus(){
        //Check if the server is supposed to be offline
        if(globals.fxRunner.fxChild === null) return this.resetMonitorStats();

        //Helper func
        const cleanET = (et) => {return (et > 99999)? '--' : et};

        //Get elapsed times & process status
        let currTimestamp = now();
        let elapsedHealthCheck = currTimestamp - this.lastSuccessfulHealthCheck;
        let healthCheckFailed = (elapsedHealthCheck > this.config.healthCheck.failThreshold);
        let elapsedHeartBeat = currTimestamp - this.lastSuccessfulHeartBeat;
        let heartBeatFailed = (elapsedHeartBeat > this.config.heartBeat.failThreshold);
        let processUptime = globals.fxRunner.getUptime();

        //Check if its online and return
        if(
            this.lastSuccessfulHealthCheck && !healthCheckFailed &&
            this.lastSuccessfulHeartBeat && !heartBeatFailed
        ){
            this.currentStatus = 'ONLINE';
            return;
        }

        //Now to the (un)fun part: if the status != healthy
        this.currentStatus = (healthCheckFailed && heartBeatFailed)? 'OFFLINE' : 'PARTIAL';

        //Check if still in cooldown
        if(processUptime < this.config.cooldown){
            if(GlobalData.verbose && processUptime > 5 && currTimestamp - this.lastStatusWarningMessage > 10){
                logWarn(`(HB:${cleanET(elapsedHeartBeat)}|HC:${cleanET(elapsedHealthCheck)}) FXServer is not responding. Still in cooldown.`)
                this.lastStatusWarningMessage = now();
            }
            return;
        }

        //Log failure message
        if(
            (GlobalData.verbose && (currTimestamp - this.lastStatusWarningMessage) > 15) ||
            ((currTimestamp - this.lastStatusWarningMessage) > 30)
        ){
            let msg = (healthCheckFailed)
                        ? `(HB:${cleanET(elapsedHeartBeat)}|HC:${cleanET(elapsedHealthCheck)}) FXServer is not responding. (${this.lastHealthCheckErrorMessage})` 
                        : `(HB:${cleanET(elapsedHeartBeat)}|HC:${cleanET(elapsedHealthCheck)}) FXServer is not responding. (HB Failed)`; 
            this.lastStatusWarningMessage = now();
            logWarn(msg);
        }
        
        //Check if fxChild is closed, in this case no need to wait the failure count
        let processStatus = globals.fxRunner.getStatus();
        if(processStatus == 'closed'){
            this.globalCounters.fullCrashes++;
            this.restartFXServer(
                'server close detected',
                globals.translator.t('restarter.crash_detected')
            );
            return;
        }

        //If http partial crash, warn 1 minute before
        if(
            elapsedHealthCheck > (this.config.healthCheck.failLimit - 60) && 
            !this.healthCheckRestartWarningIssued &&
            !(elapsedHeartBeat > this.config.heartBeat.failLimit)
        ){
            let tOptions = {
                servername: globals.config.serverName
            }
            globals.discordBot.sendAnnouncement(globals.translator.t('restarter.partial_crash_warn_discord', tOptions));
            let chatMsg = globals.translator.t('restarter.partial_crash_warn');
            globals.fxRunner.srvCmd(`txaBroadcast "txAdmin" "${chatMsg}"`);
            this.healthCheckRestartWarningIssued = now();
        }

        //Give a bit more time to the very very slow servers to come up
        //They usually start replying to healthchecks way before sending heartbeats
        let maxHBCooldownTolerance = 180;
        if(
            this.lastSuccessfulHeartBeat === null &&
            processUptime < maxHBCooldownTolerance &&
            elapsedHealthCheck < this.config.healthCheck.failLimit
        ){
            let msg = `Still waiting for the first HeartBeat. Process started ${processUptime}s ago.`;
            if(processUptime % 15 == 0) logWarn(msg);
            return;
        }

        //Check if already over the limit 
        if(
            elapsedHealthCheck > this.config.healthCheck.failLimit ||
            elapsedHeartBeat > this.config.heartBeat.failLimit
        ){
            //TODO: improve the message telling what crashed?
            if(elapsedHealthCheck > this.config.healthCheck.failLimit){
                this.globalCounters.partialCrashes++;
                this.restartFXServer(
                    'server partial crash detected',
                    globals.translator.t('restarter.crash_detected')
                );
            }else{
                this.globalCounters.fullCrashes++;
                this.restartFXServer(
                    'server crash detected',
                    globals.translator.t('restarter.crash_detected')
                );
            }
        }
    }


    //================================================================
    handleHeartBeat(postData){
        //Sanity Check
        if(!Array.isArray(postData.players)){
            if(GlobalData.verbose) logWarn(`Received an invalid HeartBeat.`);
            return;
        }

        //Cleaning playerlist
        let playerList = postData.players.map(player => {
            player.id = parseInt(player.id);
            return player;
        });

        //The rest...
        this.lastSuccessfulHeartBeat = now();
        this.timeSeries.add(playerList.length);
        globals.playerController.processHeartBeat(playerList);
    }

} //Fim Monitor()
