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
        const logMessage = `Restarting server (${reason}).`;
        globals.logger.append(`[MONITOR] ${logMessage}`);
        logWarn(logMessage);
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
        this.lastHealthCheckErrorMessage = null; //to print warning
        this.healthCheckRestartWarningIssued = false; //to prevent spamming 

        //to track http vs fd3
        //to see if its above limit
        this.lastSuccessfulFD3HeartBeat = null; 
        this.lastSuccessfulHTTPHeartBeat = null; 
        //to collect statistics
        this.hasServerStartedYet = false; 

        //to reset active player list (if module is already loaded)
        if(globals.playerController) globals.playerController.processHeartBeat([]); 
    }


    //================================================================
    async sendHealthCheck(){
        //Check if the server is supposed to be offline
        if(globals.fxRunner.fxChild === null || globals.fxRunner.fxServerPort === null) return;

        //Setup do request e variáveis iniciais
        let requestOptions = {
            url: `http://127.0.0.1:${globals.fxRunner.fxServerPort}/dynamic.json`,
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
        const currTimestamp = now();
        const elapsedHealthCheck = currTimestamp - this.lastSuccessfulHealthCheck;
        const healthCheckFailed = (elapsedHealthCheck > this.config.healthCheck.failThreshold);
        const anySuccessfulHeartBeat = (this.lastSuccessfulFD3HeartBeat !== null || this.lastSuccessfulHTTPHeartBeat !== null);
        const elapsedHeartBeat = currTimestamp - Math.max(this.lastSuccessfulFD3HeartBeat, this.lastSuccessfulHTTPHeartBeat);
        const heartBeatFailed = (elapsedHeartBeat > this.config.heartBeat.failThreshold);
        const processUptime = globals.fxRunner.getUptime();

        //Check if its online and return
        if(
            this.lastSuccessfulHealthCheck && !healthCheckFailed &&
            anySuccessfulHeartBeat && !heartBeatFailed
        ){
            this.currentStatus = 'ONLINE';
            if(this.hasServerStartedYet == false){
                this.hasServerStartedYet = true;
                globals.databus.txStatsData.bootSeconds.push(processUptime);
            }
            return;
        }

        //Now to the (un)fun part: if the status != healthy
        this.currentStatus = (healthCheckFailed && heartBeatFailed)? 'OFFLINE' : 'PARTIAL';
        const timesPrefix = `(HB:${cleanET(elapsedHeartBeat)}|HC:${cleanET(elapsedHealthCheck)})`;
        const elapsedLastWarning = currTimestamp - this.lastStatusWarningMessage;

        //Check if still in cooldown
        if(processUptime < this.config.cooldown){
            if(GlobalData.verbose && processUptime > 10 && elapsedLastWarning > 10){
                logWarn(`${timesPrefix} FXServer is not responding. Still in cooldown of ${this.config.cooldown}s.`)
                this.lastStatusWarningMessage = currTimestamp;
            }
            return;
        }

        //Log failure message
        if(elapsedLastWarning >= 15){
            const msg = (healthCheckFailed)
                        ? `${timesPrefix} FXServer is not responding. (${this.lastHealthCheckErrorMessage})` 
                        : `${timesPrefix} FXServer is not responding. (HB Failed)`; 
            this.lastStatusWarningMessage = currTimestamp;
            logWarn(msg);
        }
        
        //Check if fxChild is closed, in this case no need to wait the failure count
        const processStatus = globals.fxRunner.getStatus();
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
            !(elapsedHeartBeat > this.config.heartBeat.failLimit) && 
            !this.healthCheckRestartWarningIssued &&
            elapsedHealthCheck > (this.config.healthCheck.failLimit - 60)
        ){
            globals.discordBot.sendAnnouncement(globals.translator.t(
                'restarter.partial_crash_warn_discord', 
                {servername: globals.config.serverName}
            ));
            const chatMsg = globals.translator.t('restarter.partial_crash_warn');
            globals.fxRunner.srvCmd(`txaBroadcast "txAdmin" "${chatMsg}"`);
            this.healthCheckRestartWarningIssued = currTimestamp;
        }

        //Give a bit more time to the very very slow servers to come up
        //They usually start replying to healthchecks way before sending heartbeats
        const maxHBCooldownTolerance = 180;
        if(
            anySuccessfulHeartBeat === false &&
            processUptime < maxHBCooldownTolerance &&
            elapsedHealthCheck < this.config.healthCheck.failLimit
        ){
            if(processUptime % 15 == 0) logWarn(`Still waiting for the first HeartBeat. Process started ${processUptime}s ago.`);
            return;
        }

        //Check if already over the limit 
        if(
            elapsedHealthCheck > this.config.healthCheck.failLimit ||
            elapsedHeartBeat > this.config.heartBeat.failLimit
        ){
            if(anySuccessfulHeartBeat === false){
                globals.databus.txStatsData.bootSeconds.push(false);
                this.restartFXServer(
                    `server failed to start within ${maxHBCooldownTolerance} seconds`,
                    globals.translator.t('restarter.start_timeout')
                );
                
            }else if(elapsedHealthCheck > this.config.healthCheck.failLimit){
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
    handleHeartBeat(source, postData){
        const tsNow = now();
        if(source === 'fd3'){
            //Processing stats
            if(
                this.lastSuccessfulHTTPHeartBeat &&
                tsNow - this.lastSuccessfulHTTPHeartBeat > 15 &&
                tsNow - this.lastSuccessfulFD3HeartBeat < 5
            ){
                globals.databus.txStatsData.heartBeatStats.httpFailed++;
            }
            this.lastSuccessfulFD3HeartBeat = tsNow;
        
        }else if(source === 'http'){
            //Sanity Check
            if(!Array.isArray(postData.players)){
                if(GlobalData.verbose) logWarn(`Received an invalid HeartBeat.`);
                return;
            }

            //Processing playerlist
            const playerList = postData.players.map(player => {
                player.id = parseInt(player.id);
                return player;
            });
            this.timeSeries.add(playerList.length);
            globals.playerController.processHeartBeat(playerList);

            //Processing stats
            if(
                this.lastSuccessfulFD3HeartBeat && 
                tsNow - this.lastSuccessfulFD3HeartBeat > 15 &&
                tsNow - this.lastSuccessfulHTTPHeartBeat < 5
            ){
                globals.databus.txStatsData.heartBeatStats.fd3Failed++;
            }
            this.lastSuccessfulHTTPHeartBeat = tsNow;
        }
    }

} //Fim Monitor()
