//Requires
const modulename = 'Monitor';
const got = require('../../extras/got');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const helpers = require('../../extras/helpers');
const getHostStats = require('./getHostStats');

//Helper functions
const now = () => { return Math.round(Date.now() / 1000); };
const isUndefined = (x) => { return (typeof x === 'undefined'); };

module.exports = class Monitor {
    constructor(config) {
        this.config = config;

        //Checking config validity
        if (this.config.cooldown < 15) throw new Error('The monitor.cooldown setting must be 15 seconds or higher.');
        if (!Array.isArray(this.config.restarterScheduleWarnings)) throw new Error('The monitor.restarterScheduleWarnings must be an array.');

        //Hardcoded Configs
        //NOTE: done mainly because the timeout/limit was never useful, and makes things more complicated
        this.hardConfigs = {
            timeout: 1500,
            defaultWarningTimes: [30, 15, 10, 5, 4, 3, 2, 1],
            maxHBCooldownTolerance: 300,
            healthCheck: {
                failThreshold: 15,
                failLimit: 300,
            },
            heartBeat: {
                failThreshold: 15,
                failLimit: 60,
            },
        };

        //Setting up
        this.hostStats = null;
        this.schedule = null;
        this.resetMonitorStats();
        this.buildSchedule();

        //Cron functions
        setInterval(() => {
            this.sendHealthCheck();
            this.refreshServerStatus();
        }, 1000);
        setInterval(async () => {
            this.hostStats = await getHostStats();
        }, 5000);
        setInterval(() => {
            this.checkRestartSchedule();
        }, 60 * 1000);
    }


    //================================================================
    /**
     * Refresh Monitor configurations
     */
    refreshConfig() {
        this.config = globals.configVault.getScoped('monitor');
        this.buildSchedule();
    }//Final refreshConfig()


    //================================================================
    /**
     * Build schedule
     */
    buildSchedule() {
        if (!Array.isArray(this.config.restarterSchedule) || !this.config.restarterSchedule.length) {
            this.schedule = false;
            return;
        }

        let getScheduleObj = (hour, minute, sub, sendMessage = false) => {
            const time = new Date();
            time.setHours(hour);
            time.setMinutes(minute - sub);

            const tOptions = {
                smart_count: sub,
                servername: globals.config.serverName,
            };
            return {
                hour: time.getHours(),
                minute: time.getMinutes(),
                remaining: sub,
                restart: false,
                messages: (!sendMessage) ? false : {
                    chat: globals.translator.t('restarter.schedule_warn', tOptions),
                    discord: globals.translator.t('restarter.schedule_warn_discord', tOptions),
                },
            };
        };

        const times = helpers.parseSchedule(this.config.restarterSchedule);
        const warnTimes = this.hardConfigs.defaultWarningTimes.concat(
            this.config.restarterScheduleWarnings.filter(
                (item) => this.hardConfigs.defaultWarningTimes.indexOf(item) < 0,
            ),
        ).sort((a, b) => b - a);

        const schedule = [];
        times.forEach((time) => {
            try {
                warnTimes.forEach((mins) => {
                    schedule.push(getScheduleObj(time.hour, time.minute, mins, this.config.restarterScheduleWarnings.includes(mins)));
                });
                schedule.push({
                    hour: time.hour,
                    minute: time.minute,
                    remaining: 0,
                    restart: true,
                    messages: false,
                });
            } catch (error) {
                const timeJSON = JSON.stringify(time);
                if (GlobalData.verbose) logWarn(`Error building restart schedule for time '${timeJSON}':\n ${error.message}`);
            }
        });

        if (GlobalData.verbose) dir(schedule.map((el) => { return el.messages; }));
        this.schedule = (schedule.length) ? schedule : false;
    }


    //================================================================
    /**
     * Check the restart schedule
     */
    checkRestartSchedule() {
        if (!Array.isArray(this.schedule)) return;
        if (globals.fxRunner.fxChild === null) return;

        try {
            //Check schedule for current time
            //NOTE: returns only the first result, not necessarily the most important
            // eg, when a restart message comes before a restart command
            const currTime = new Date;
            const action = this.schedule.find((time) => {
                return (time.hour == currTime.getHours() && time.minute == currTime.getMinutes());
            });
            if (!action) return;

            // Dispatch `txAdmin:events:scheduledRestart`
            globals.fxRunner.sendEvent('scheduledRestart', {
                secondsRemaining: action.remaining * 60,
            });

            //Perform scheduled action
            if (action.restart === true) {
                const currTimestamp = currTime.getHours().toString().padStart(2, '0') + ':' + currTime.getMinutes().toString().padStart(2, '0');
                this.restartFXServer(
                    `scheduled restart at ${currTimestamp}`,
                    globals.translator.t('restarter.schedule_reason', {time: currTimestamp}),
                );
            } else if (action.messages) {
                globals.discordBot.sendAnnouncement(action.messages.discord);
                if (!this.config.disableChatWarnings) {
                    // Dispatch `txAdmin:events:announcement`
                    const cmdOk = globals.fxRunner.sendEvent('announcement', {
                        author: 'txAdmin',
                        message: action.messages.chat,
                    });
                }
            }
        } catch (error) {
            if (GlobalData.verbose) dir(error);
        }
    }


    //================================================================
    /**
     * Restart the FXServer and logs everything
     * @param {string} reason
     * @param {string} reasonTranslated
     */
    async restartFXServer(reason, reasonTranslated) {
        //sanity check
        if (globals.fxRunner.fxChild === null) {
            logWarn('Server not started, no need to restart');
            return false;
        }

        //Restart server
        const logMessage = `Restarting server (${reason}).`;
        globals.logger.admin.write(`[MONITOR] ${logMessage}`);
        logWarn(logMessage);
        globals.fxRunner.restartServer(reasonTranslated);
    }


    //================================================================
    resetMonitorStats() {
        this.currentStatus = 'OFFLINE'; // options: OFFLINE, ONLINE, PARTIAL
        this.lastRefreshStatus = null; //to prevent DDoS crash false positive
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
        if (globals.playerController) globals.playerController.processHeartBeat([]);
    }


    //================================================================
    async sendHealthCheck() {
        //Check if the server is supposed to be offline
        if (globals.fxRunner.fxChild === null || globals.fxRunner.fxServerPort === null) return;

        //Make request
        let dynamicResp;
        const requestOptions = {
            url: `http://${globals.fxRunner.fxServerHost}/dynamic.json`,
            timeout: this.hardConfigs.timeout,
            maxRedirects: 0,
            retry: {limit: 0},
        };
        try {
            const data = await got.get(requestOptions).json();
            if (typeof data !== 'object') throw new Error("FXServer's dynamic endpoint didn't return a JSON object.");
            if (isUndefined(data.hostname) || isUndefined(data.clients)) throw new Error("FXServer's dynamic endpoint didn't return complete data.");
            dynamicResp = data;
        } catch (error) {
            this.lastHealthCheckErrorMessage = error.message;
            return;
        }

        //Checking for the maxClients
        if (
            GlobalData.deployerDefaults
            && GlobalData.deployerDefaults.maxClients
            && dynamicResp
            && dynamicResp.sv_maxclients
        ) {
            const maxClients = parseInt(dynamicResp.sv_maxclients);
            if (!isNaN(maxClients) && maxClients > GlobalData.deployerDefaults.maxClients) {
                globals.fxRunner.srvCmd(`sv_maxclients ${GlobalData.deployerDefaults.maxClients} ##ZAP-Hosting: please don't modify`);
                logError(`ZAP-Hosting: Detected that the server has sv_maxclients above the limit (${GlobalData.deployerDefaults.maxClients}). Changing back to the limit.`);
                globals.logger.admin.write(`[SYSTEM] changing sv_maxclients back to ${GlobalData.deployerDefaults.maxClients}`);
            }
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
    refreshServerStatus() {
        //Check if the server is supposed to be offline
        if (globals.fxRunner.fxChild === null) return this.resetMonitorStats();

        //Helper func
        const cleanET = (et) => {return (et > 99999) ? '--' : et;};

        //Check if process was frozen
        const currTimestamp = now();
        const elapsedRefreshStatus = currTimestamp - this.lastRefreshStatus;
        if (this.lastRefreshStatus !== null && elapsedRefreshStatus > 10) {
            globals.databus.txStatsData.monitorStats.freezeSeconds.push(elapsedRefreshStatus - 1);
            if (globals.databus.txStatsData.monitorStats.freezeSeconds.length > 30) globals.databus.txStatsData.monitorStats.freezeSeconds.shift();
            logError(`FXServer was frozen for ${elapsedRefreshStatus - 1} seconds for unknown reason (random issue, VPS Lag, DDoS, etc).`);
            logError('Don\'t worry, txAdmin is preventing the server from being restarted.');
            this.lastRefreshStatus = currTimestamp;
            return;
        }
        this.lastRefreshStatus = currTimestamp;

        //Get elapsed times & process status
        const elapsedHealthCheck = currTimestamp - this.lastSuccessfulHealthCheck;
        const healthCheckFailed = (elapsedHealthCheck > this.hardConfigs.healthCheck.failThreshold);
        const anySuccessfulHeartBeat = (this.lastSuccessfulFD3HeartBeat !== null || this.lastSuccessfulHTTPHeartBeat !== null);
        const elapsedHeartBeat = currTimestamp - Math.max(this.lastSuccessfulFD3HeartBeat, this.lastSuccessfulHTTPHeartBeat);
        const heartBeatFailed = (elapsedHeartBeat > this.hardConfigs.heartBeat.failThreshold);
        const processUptime = globals.fxRunner.getUptime();

        //Check if its online and return
        if (
            this.lastSuccessfulHealthCheck
            && !healthCheckFailed
            && anySuccessfulHeartBeat
            && !heartBeatFailed
        ) {
            this.currentStatus = 'ONLINE';
            if (this.hasServerStartedYet == false) {
                this.hasServerStartedYet = true;
                globals.databus.txStatsData.monitorStats.bootSeconds.push(processUptime);
            }
            return;
        }

        //Now to the (un)fun part: if the status != healthy
        this.currentStatus = (healthCheckFailed && heartBeatFailed) ? 'OFFLINE' : 'PARTIAL';
        const timesPrefix = `(HB:${cleanET(elapsedHeartBeat)}|HC:${cleanET(elapsedHealthCheck)})`;
        const elapsedLastWarning = currTimestamp - this.lastStatusWarningMessage;

        //Check if still in cooldown
        if (processUptime < this.config.cooldown) {
            if (GlobalData.verbose && processUptime > 10 && elapsedLastWarning > 10) {
                logWarn(`${timesPrefix} FXServer is not responding. Still in cooldown of ${this.config.cooldown}s.`);
                this.lastStatusWarningMessage = currTimestamp;
            }
            return;
        }

        //Log failure message
        if (elapsedLastWarning >= 15) {
            const msg = (healthCheckFailed)
                ? `${timesPrefix} FXServer is not responding. (${this.lastHealthCheckErrorMessage})`
                : `${timesPrefix} FXServer is not responding. (HB Failed)`;
            this.lastStatusWarningMessage = currTimestamp;
            logWarn(msg);
        }

        //Check if fxChild is closed, in this case no need to wait the failure count
        const processStatus = globals.fxRunner.getStatus();
        if (processStatus == 'closed') {
            globals.databus.txStatsData.monitorStats.restartReasons.close++;
            this.restartFXServer(
                'server close detected',
                globals.translator.t('restarter.crash_detected'),
            );
            return;
        }

        //If http partial crash, warn 1 minute before
        if (
            !(elapsedHeartBeat > this.hardConfigs.heartBeat.failLimit)
            && !this.healthCheckRestartWarningIssued
            && elapsedHealthCheck > (this.hardConfigs.healthCheck.failLimit - 60)
        ) {
            globals.discordBot.sendAnnouncement(globals.translator.t(
                'restarter.partial_hang_warn_discord',
                {servername: globals.config.serverName},
            ));
            // Dispatch `txAdmin:events:announcement`
            const cmdOk = globals.fxRunner.sendEvent('announcement', {
                author: 'txAdmin',
                message: globals.translator.t('restarter.partial_hang_warn'),
            });

            this.healthCheckRestartWarningIssued = currTimestamp;
        }

        //Give a bit more time to the very very slow servers to come up
        //They usually start replying to healthchecks way before sending heartbeats
        if (
            anySuccessfulHeartBeat === false
            && processUptime < this.hardConfigs.maxHBCooldownTolerance
            && elapsedHealthCheck < this.hardConfigs.healthCheck.failLimit
        ) {
            if (processUptime % 15 == 0) logWarn(`Still waiting for the first HeartBeat. Process started ${processUptime}s ago.`);
            return;
        }

        //Check if already over the limit
        if (
            elapsedHealthCheck > this.hardConfigs.healthCheck.failLimit
            || elapsedHeartBeat > this.hardConfigs.heartBeat.failLimit
        ) {
            if (anySuccessfulHeartBeat === false) {
                globals.databus.txStatsData.monitorStats.bootSeconds.push(false);
                this.restartFXServer(
                    `server failed to start within ${this.hardConfigs.maxHBCooldownTolerance} seconds`,
                    globals.translator.t('restarter.start_timeout'),
                );
            } else if (elapsedHealthCheck > this.hardConfigs.healthCheck.failLimit) {
                globals.databus.txStatsData.monitorStats.restartReasons.healthCheck++;
                this.restartFXServer(
                    'server partial hang detected',
                    globals.translator.t('restarter.hang_detected'),
                );
            } else {
                globals.databus.txStatsData.monitorStats.restartReasons.heartBeat++;
                this.restartFXServer(
                    'server hang detected',
                    globals.translator.t('restarter.hang_detected'),
                );
            }
        }
    }


    //================================================================
    handleHeartBeat(source, postData) {
        const tsNow = now();
        if (source === 'fd3') {
            //Processing stats
            if (
                this.lastSuccessfulHTTPHeartBeat
                && tsNow - this.lastSuccessfulHTTPHeartBeat > 15
                && tsNow - this.lastSuccessfulFD3HeartBeat < 5
            ) {
                globals.databus.txStatsData.monitorStats.heartBeatStats.httpFailed++;
            }
            this.lastSuccessfulFD3HeartBeat = tsNow;
        } else if (source === 'http') {
            //Sanity Check
            if (!Array.isArray(postData.players)) {
                if (GlobalData.verbose) logWarn('Received an invalid HeartBeat.');
                return;
            }

            //Processing playerlist
            const playerList = postData.players.map((player) => {
                player.id = parseInt(player.id);
                return player;
            });
            globals.playerController.processHeartBeat(playerList);

            //Processing stats
            if (
                this.lastSuccessfulFD3HeartBeat
                && tsNow - this.lastSuccessfulFD3HeartBeat > 15
                && tsNow - this.lastSuccessfulHTTPHeartBeat < 5
            ) {
                globals.databus.txStatsData.monitorStats.heartBeatStats.fd3Failed++;
            }
            this.lastSuccessfulHTTPHeartBeat = tsNow;
        }
    }
}; //Fim Monitor()
