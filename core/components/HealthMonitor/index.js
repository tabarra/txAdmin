const modulename = 'HealthMonitor';
import got from 'got'; //we want internal requests to have 127.0.0.1 src
import logger from '@core/extras/console.js';
import { convars, verbose } from '@core/globalData.js';
import getHostStats from './getHostStats';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

//Helper functions
const now = () => { return Math.round(Date.now() / 1000); };
const isUndefined = (x) => { return (typeof x === 'undefined'); };

export default class HealthMonitor {
    constructor(config) {
        this.config = config;

        //Checking config validity
        if (this.config.cooldown < 15) throw new Error('The monitor.cooldown setting must be 15 seconds or higher.');
        if (this.config.resourceStartingTolerance < 30) throw new Error('The monitor.resourceStartingTolerance setting must be 30 seconds or higher.');

        //Hardcoded Configs
        //NOTE: done mainly because the timeout/limit was never useful, and makes things more complicated
        this.hardConfigs = {
            timeout: 1500,
            defaultWarningTimes: [30, 15, 10, 5, 4, 3, 2, 1],

            //HTTP GET /dynamic.json from txAdmin to sv_main.lua
            healthCheck: {
                failThreshold: 15,
                failLimit: 300,
            },

            //HTTP POST /intercom/monitor from sv_main.lua to txAdmin
            heartBeat: {
                failThreshold: 15,
                failLimit: 60,
                resStartedCooldown: 30, //wait for HB up to 30 seconds after last resource started
            },
        };

        //Setting up
        this.hostStats = null;
        this.schedule = null;
        this.resetMonitorStats();

        //Cron functions
        setInterval(() => {
            this.sendHealthCheck();
            this.refreshServerStatus();
        }, 1000);
        setInterval(async () => {
            this.hostStats = await getHostStats();
        }, 5000);
    }


    /**
     * Refresh Monitor configurations
     */
    refreshConfig() {
        this.config = globals.configVault.getScoped('monitor');
    }//Final refreshConfig()


    /**
     * Restart the FXServer and logs everything
     * @param {string} reasonInternal
     * @param {string} reasonTranslated
     */
    async restartFXServer(reasonInternal, reasonTranslated) {
        //sanity check
        if (globals.fxRunner.fxChild === null) {
            logWarn('Server not started, no need to restart');
            return false;
        }

        //Restart server
        this.isAwaitingRestart = true;
        const logMessage = `Restarting server (${reasonInternal}).`;
        globals.logger.admin.write(`[MONITOR] ${logMessage}`);
        logWarn(logMessage);
        globals.fxRunner.restartServer(reasonTranslated, null);
    }


    //================================================================
    resetMonitorStats() {
        this.currentStatus = 'OFFLINE'; // options: OFFLINE, ONLINE, PARTIAL
        this.lastRefreshStatus = null; //to prevent DDoS crash false positive
        this.lastSuccessfulHealthCheck = null; //to see if its above limit
        this.lastStatusWarningMessage = null; //to prevent spamming
        this.lastHealthCheckErrorMessage = null; //to print warning
        this.healthCheckRestartWarningIssued = false; //to prevent spamming
        this.isAwaitingRestart = false; //to prevent spamming while the server restarts (5s)

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
        if (globals.fxRunner.fxChild === null || globals.fxRunner.fxServerHost === null) return;

        //Make request
        let dynamicResp;
        const requestOptions = {
            url: `http://${globals.fxRunner.fxServerHost}/dynamic.json`,
            timeout: this.hardConfigs.timeout,
            maxRedirects: 0,
            retry: { limit: 0 },
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
            convars.deployerDefaults
            && convars.deployerDefaults.maxClients
            && dynamicResp
            && dynamicResp.sv_maxclients
        ) {
            const maxClients = parseInt(dynamicResp.sv_maxclients);
            if (!isNaN(maxClients) && maxClients > convars.deployerDefaults.maxClients) {
                globals.fxRunner.srvCmd(`sv_maxclients ${convars.deployerDefaults.maxClients} ##ZAP-Hosting: please don't modify`);
                logError(`ZAP-Hosting: Detected that the server has sv_maxclients above the limit (${convars.deployerDefaults.maxClients}). Changing back to the limit.`);
                globals.logger.admin.write(`[SYSTEM] changing sv_maxclients back to ${convars.deployerDefaults.maxClients}`);
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
     *  - HeartBeat: receiving an intercom POST or FD3 txAdminHeartBeat event
     */
    refreshServerStatus() {
        //Check if the server is supposed to be offline
        if (globals.fxRunner.fxChild === null) return this.resetMonitorStats();

        //Ignore check while server is restarting
        if (this.isAwaitingRestart) return;

        //Helper func
        const cleanET = (et) => { return (et > 99999) ? '--' : et; };

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
            if (verbose && processUptime > 10 && elapsedLastWarning > 10) {
                logWarn(`${timesPrefix} FXServer is not responding. Still in cooldown of ${this.config.cooldown}s.`);
                this.lastStatusWarningMessage = currTimestamp;
            }
            return;
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

        //Log failure message
        if (elapsedLastWarning >= 15) {
            const msg = (healthCheckFailed)
                ? `${timesPrefix} FXServer is not responding. (${this.lastHealthCheckErrorMessage})`
                : `${timesPrefix} FXServer is not responding. (HB Failed)`;
            this.lastStatusWarningMessage = currTimestamp;
            logWarn(msg);
        }

        //If http partial crash, warn 1 minute before
        if (
            !(elapsedHeartBeat > this.hardConfigs.heartBeat.failLimit)
            && !this.healthCheckRestartWarningIssued
            && elapsedHealthCheck > (this.hardConfigs.healthCheck.failLimit - 60)
        ) {
            globals.discordBot.sendAnnouncement(globals.translator.t(
                'restarter.partial_hang_warn_discord',
                { servername: globals.config.serverName },
            ));
            // Dispatch `txAdmin:events:announcement`
            const _cmdOk = globals.fxRunner.sendEvent('announcement', {
                author: 'txAdmin',
                message: globals.translator.t('restarter.partial_hang_warn'),
            });

            this.healthCheckRestartWarningIssued = currTimestamp;
        }

        //Give a bit more time to the very very slow servers to come up
        //They usually start replying to healthchecks way before sending heartbeats
        //Only logWarn/skip if there is a resource start pending
        const starting = globals.resourcesManager.tmpGetPendingStart();
        if (
            anySuccessfulHeartBeat === false
            && starting.startingElapsedSecs !== null
            && starting.startingElapsedSecs < this.config.resourceStartingTolerance
        ) {
            if (processUptime % 15 == 0) {
                logWarn(`Still waiting for the first HeartBeat. Process started ${processUptime}s ago.`);
                logWarn(`The server is currently starting ${starting.startingResName} (${starting.startingElapsedSecs}s ago).`);
            }
            return;
        }

        //Maybe it just finished loading the resources, but no HeartBeat yet
        if(
            anySuccessfulHeartBeat === false
            && starting.lastStartElapsedSecs !== null
            && starting.lastStartElapsedSecs < this.hardConfigs.heartBeat.resStartedCooldown
        ){
            if (processUptime % 15 == 0) {
                logWarn(`Still waiting for the first HeartBeat. Process started ${processUptime}s ago.`);
                logWarn(`No resource start pending, last resource started ${starting.lastStartElapsedSecs}s ago.`);
            }
            return;
        }

        //Check if already over the limit
        if (
            elapsedHealthCheck > this.hardConfigs.healthCheck.failLimit
            || elapsedHeartBeat > this.hardConfigs.heartBeat.failLimit
        ) {
            if (anySuccessfulHeartBeat === false) {
                globals.databus.txStatsData.monitorStats.bootSeconds.push(false);

                if(starting.startingElapsedSecs !== null){
                    //Resource didn't finish starting (if res boot still active)
                    this.restartFXServer(
                        `resource "${starting.startingResName}" failed to start within the ${this.config.resourceStartingTolerance}s time limit`,
                        globals.translator.t('restarter.start_timeout'),
                    );
                }else if(starting.lastStartElapsedSecs !== null){
                    //Resources started, but last was above limit
                    this.restartFXServer(
                        `server failed to start within time limit - ${this.hardConfigs.heartBeat.resStartedCooldown}s after last resource started`,
                        globals.translator.t('restarter.start_timeout'),
                    );
                }else{
                    //No resource started starting, hb over limit
                    this.restartFXServer(
                        `server failed to start within time limit - ${this.hardConfigs.heartBeat.failLimit}s, no onResourceStarting received`,
                        globals.translator.t('restarter.start_timeout'),
                    );
                }
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
                if (verbose) logWarn('Received an invalid HeartBeat.');
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
};
