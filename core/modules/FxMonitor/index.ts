const modulename = 'FxMonitor';
import got from 'got'; //we need internal requests to have 127.0.0.1 src
import { txHostConfig } from '@core/globalData';
import { Stopwatch } from './utils';
import consoleFactory from '@lib/console';
import { now } from '@lib/misc';
import { SYM_SYSTEM_AUTHOR } from '@lib/symbols';
import { ChildProcessState } from '@modules/FxRunner/ProcessManager';
const console = consoleFactory(modulename);


//Hardcoded Configs
const HC_CONFIG = {
    failThreshold: 15,
    failLimit: 300,
    requestTimeout: 1500,
};
const HB_CONFIG = {
    failThreshold: 15,
    failLimit: 60,
    //wait for HB up to 45 seconds after last resource started
    resStartedCooldown: 45,
};


//Helpers
const cleanET = (et: number) => et > 99999 ? '--' : et;
enum HealthStatus {
    OFFLINE = 'OFFLINE',
    ONLINE = 'ONLINE',
    PARTIAL = 'PARTIAL',
}


/**
 * Module responsible for monitoring the FXServer health and status, restarting it if necessary.
 */
export default class FxMonitor {
    //Status tracking
    public currentStatus: HealthStatus = HealthStatus.OFFLINE;
    private lastHealthCheckErrorMessage: string | null = null; //to print warning
    private isAwaitingRestart = false; //to prevent spamming while the server restarts (5s)
    private hasServerStartedYet = false;
    public readonly timers: NodeJS.Timer[] = [];

    //to prevent DDoS crash false positive
    private readonly swLastRefreshStatus = new Stopwatch();

    //to prevent spamming
    private readonly swLastRestartWarning = new Stopwatch();
    private readonly swLastStatusWarning = new Stopwatch();

    //to see if its above limit
    private readonly swLastHealthCheck = new Stopwatch();
    private readonly swLastFD3 = new Stopwatch();
    private readonly swLastHTTP = new Stopwatch();


    constructor() {
        //Cron functions
        const cronId = setInterval(() => {
            this.sendHealthCheck();
            this.refreshServerStatus();
        }, 1000);
        this.timers.push(cronId);
    }


    /**
     * Triggers FXServer restart and logs the reason.
     */
    async triggerServerRestart(reasonInternal: string, reasonTranslated: string, timesPrefix: string) {
        //Sanity check
        if (txCore.fxRunner.isIdle) {
            console.warn('Server not started, no need to restart');
            return false;
        }

        //Restart server
        this.isAwaitingRestart = true;
        const logMessage = `Restarting server: ${reasonInternal} ${timesPrefix}`;
        txCore.logger.admin.write('MONITOR', logMessage);
        txCore.logger.fxserver.logInformational(logMessage); //just for better visibility
        txCore.fxRunner.restartServer(reasonTranslated, SYM_SYSTEM_AUTHOR);
    }


    /**
     * Sets the current status and propagates the change to the Discord Bot and WebServer
     */
    setCurrentStatus(newStatus: HealthStatus) {
        if (newStatus !== this.currentStatus) {
            this.currentStatus = newStatus;
            txCore.discordBot.updateBotStatus().catch((e) => { });
            txCore.webServer.webSocket.pushRefresh('status');
        }
    }


    /**
     * Reset Health Monitor Stats
     */
    resetMonitorStats() {
        this.setCurrentStatus(HealthStatus.OFFLINE);
        this.lastHealthCheckErrorMessage = null;
        this.isAwaitingRestart = false;
        this.hasServerStartedYet = false;

        this.swLastRefreshStatus.reset();
        this.swLastRestartWarning.reset();
        this.swLastStatusWarning.reset();

        this.swLastHealthCheck.reset();
        this.swLastFD3.reset();
        this.swLastHTTP.reset();
    }


    /**
     * Sends a HTTP GET request to the /dynamic.json endpoint of FXServer to check if it's healthy.
     */
    async sendHealthCheck() {
        //Check if the server is supposed to be offline
        const childState = txCore.fxRunner.child;
        if (!childState?.isAlive || !childState?.netEndpoint) return;

        //Make request
        let dynamicResp;
        const requestOptions = {
            url: `http://${childState.netEndpoint}/dynamic.json`,
            maxRedirects: 0,
            timeout: {
                request: HC_CONFIG.requestTimeout,
            },
            retry: {
                limit: 0,
            },
        };
        try {
            const data = await got.get(requestOptions).json<any>(); //FIXME: any
            if (typeof data !== 'object') throw new Error('/dynamic.json response is not valid JSON.');
            if (typeof data?.hostname !== 'string') throw new Error('/dynamic.json response without hostname string.');
            if (typeof data?.clients !== 'number') throw new Error('/dynamic.json response without clients number.');
            dynamicResp = data;
        } catch (error) {
            this.lastHealthCheckErrorMessage = (error as Error).message;
            return;
        }

        //Checking for the maxClients
        if (dynamicResp && dynamicResp.sv_maxclients !== undefined) {
            const maxClients = parseInt(dynamicResp.sv_maxclients);
            if (!isNaN(maxClients)) {
                txCore.cacheStore.set('fxsRuntime:maxClients', maxClients);

                if (txHostConfig.forceMaxClients && maxClients > txHostConfig.forceMaxClients) {
                    txCore.fxRunner.sendCommand(
                        'sv_maxclients',
                        [txHostConfig.forceMaxClients],
                        SYM_SYSTEM_AUTHOR
                    );
                    console.error(`${txHostConfig.sourceName}: Detected that the server has sv_maxclients above the limit (${txHostConfig.forceMaxClients}). Changing back to the limit.`);
                    txCore.logger.admin.write('SYSTEM', `changing sv_maxclients back to ${txHostConfig.forceMaxClients}`);
                }
            }
        }

        //Set variables
        this.swLastRestartWarning.reset();
        this.lastHealthCheckErrorMessage = null;
        this.swLastHealthCheck.restart();
    }


    /**
     * Refreshes the Server Status and calls for a restart if neccessary.
     *  - HealthCheck: performing an GET to the /dynamic.json file
     *  - HeartBeat: receiving an intercom POST or FD3 txAdminHeartBeat event
     */
    refreshServerStatus() {
        //Check if the server is supposed to be offline
        if (txCore.fxRunner.isIdle) return this.resetMonitorStats();

        //Ignore check while server is restarting
        if (this.isAwaitingRestart) return;

        //Check if process was frozen
        if (this.swLastRefreshStatus.isOver(10)) {
            console.error(`FXServer was frozen for ${this.swLastRefreshStatus.elapsed - 1} seconds for unknown reason (random issue, VPS Lag, DDoS, etc).`);
            console.error('Don\'t worry, txAdmin is preventing the server from being restarted.');
            this.swLastRefreshStatus.restart();
            return;
        }
        this.swLastRefreshStatus.restart();

        //Get elapsed times & process status
        const anySuccessfulHealthCheck = this.swLastHealthCheck.started;
        const elapsedHealthCheck = this.swLastHealthCheck.elapsed;
        const healthCheckFailed = this.swLastHealthCheck.isOver(HC_CONFIG.failThreshold);
        const anySuccessfulHeartBeat = (this.swLastFD3.started || this.swLastFD3.started);
        const elapsedHeartBeat = Math.min(
            this.swLastFD3.elapsed,
            this.swLastHTTP.elapsed,
        );
        const heartBeatFailed = anySuccessfulHeartBeat && elapsedHeartBeat > HB_CONFIG.failThreshold;
        const processUptime = Math.floor((txCore.fxRunner.child?.uptime ?? 0) / 1000);
        const timesPrefix = `(HB:${cleanET(elapsedHeartBeat)}|HC:${cleanET(elapsedHealthCheck)})`;

        //Don't wait for the fail counts if the child was destroyed
        if (txCore.fxRunner.child?.status === ChildProcessState.Destroyed) {
            txCore.metrics.txRuntime.registerFxserverRestart('close');
            this.triggerServerRestart(
                'server close detected',
                txCore.translator.t('restarter.crash_detected'),
                timesPrefix,
            );
            return;
        }

        //Check if its online and return
        if (
            anySuccessfulHealthCheck
            && !healthCheckFailed
            && anySuccessfulHeartBeat
            && !heartBeatFailed
        ) {
            this.setCurrentStatus(HealthStatus.ONLINE);
            if (this.hasServerStartedYet === false) {
                this.hasServerStartedYet = true;
                txCore.metrics.txRuntime.registerFxserverBoot(processUptime);
                txCore.metrics.svRuntime.logServerBoot(processUptime);
                txCore.fxRunner.signalSpawnBackoffRequired(false);
            }
            return;
        }

        //Now to the (un)fun part: if the status != healthy
        const currentStatusString = (healthCheckFailed && heartBeatFailed) ? HealthStatus.OFFLINE : HealthStatus.PARTIAL
        this.setCurrentStatus(currentStatusString);

        //Check if still in cooldown
        if (processUptime < txConfig.restarter.bootGracePeriod) {
            if (console.isVerbose && processUptime > 10 && this.swLastStatusWarning.isOver(10)) {
                console.warn(`${timesPrefix} FXServer status is ${currentStatusString}. Still in cooldown of ${txConfig.restarter.bootGracePeriod}s.`);
                this.swLastStatusWarning.restart();
            }
            return;
        }

        //Log failure message
        if (this.swLastStatusWarning.isOver(15)) {
            this.swLastStatusWarning.restart();
            let reason = 'Unknown';
            if (healthCheckFailed && heartBeatFailed) {
                reason = 'Full Hang';
            } else if (healthCheckFailed) {
                reason = this.lastHealthCheckErrorMessage ?? 'Unknown HC failure';
            } else if (heartBeatFailed) {
                reason = 'HB Failed';
            }
            console.warn(`${timesPrefix} FXServer is not responding. (${reason})`);
        }

        //If http-only hang, warn 1 minute before restart
        if (
            !(elapsedHeartBeat > HB_CONFIG.failLimit)
            && !this.swLastRestartWarning.started
            && elapsedHealthCheck > (HC_CONFIG.failLimit - 60)
        ) {
            this.swLastRestartWarning.restart();

            //Sending discord announcement
            txCore.discordBot.sendAnnouncement({
                type: 'danger',
                description: {
                    key: 'restarter.partial_hang_warn_discord',
                    data: { servername: txConfig.general.serverName },
                },
            });

            // Dispatch `txAdmin:events:announcement`
            txCore.fxRunner.sendEvent('announcement', {
                author: 'txAdmin',
                message: txCore.translator.t('restarter.partial_hang_warn'),
            });
        }

        //Give a bit more time to the very very slow servers to come up
        //They usually start replying to healthchecks way before sending heartbeats
        //Only logWarn/skip if there is a resource start pending
        const starting = txCore.fxResources.tmpGetPendingStart();
        if (
            anySuccessfulHeartBeat === false
            && starting.startingElapsedSecs !== null
            && starting.startingElapsedSecs < txConfig.restarter.resourceStartingTolerance
        ) {
            if (processUptime % 15 === 0) {
                console.warn(`Still waiting for the first HeartBeat. Process started ${processUptime}s ago.`);
                console.warn(`The server is currently starting "${starting.startingResName}" (${starting.startingElapsedSecs}s ago).`);
            }
            return;
        }

        //Maybe it just finished loading the resources, but no HeartBeat yet
        if (
            anySuccessfulHeartBeat === false
            && starting.lastStartElapsedSecs !== null
            && starting.lastStartElapsedSecs < HB_CONFIG.resStartedCooldown
        ) {
            if (processUptime % 15 === 0) {
                console.warn(`Still waiting for the first HeartBeat. Process started ${processUptime}s ago.`);
                console.warn(`No resource start pending, last resource started ${starting.lastStartElapsedSecs}s ago.`);
            }
            return;
        }

        //Check if already over the limit
        const healthCheckOverLimit = (elapsedHealthCheck > HC_CONFIG.failLimit);
        const heartBeatOverLimit = (elapsedHeartBeat > HB_CONFIG.failLimit);
        if (healthCheckOverLimit || heartBeatOverLimit) {
            if (anySuccessfulHeartBeat === false) {
                if (starting.startingElapsedSecs !== null) {
                    //Resource didn't finish starting (if res boot still active)
                    this.triggerServerRestart(
                        `resource "${starting.startingResName}" failed to start within the ${txConfig.restarter.resourceStartingTolerance}s time limit`,
                        txCore.translator.t('restarter.start_timeout'),
                        timesPrefix,
                    );
                } else if (starting.lastStartElapsedSecs !== null) {
                    //Resources started, but no heartbeat whithin limit after that
                    this.triggerServerRestart(
                        `server failed to start within time limit - ${HB_CONFIG.resStartedCooldown}s after last resource started`,
                        txCore.translator.t('restarter.start_timeout'),
                        timesPrefix,
                    );
                } else {
                    //No resource started starting, hb over limit
                    this.triggerServerRestart(
                        `server failed to start within time limit - ${HB_CONFIG.failLimit}s, no onResourceStarting received`,
                        txCore.translator.t('restarter.start_timeout'),
                        timesPrefix,
                    );
                }
            } else if (anySuccessfulHealthCheck === false) {
                //HB started, but HC didn't
                this.triggerServerRestart(
                    `server failed to start within time limit - resources running but HTTP endpoint unreachable`,
                    txCore.translator.t('restarter.start_timeout'),
                    timesPrefix,
                );
            } else {
                //Both threads started, but now at least one stopepd
                let issueMsg, issueSrc;
                if (healthCheckFailed && heartBeatFailed) {
                    issueMsg = 'server full hang detected';
                    issueSrc = 'both' as const;
                } else if (healthCheckFailed) {
                    issueMsg = 'server http hang detected';
                    issueSrc = 'healthCheck' as const;
                } else {
                    issueMsg = 'server resources hang detected';
                    issueSrc = 'heartBeat' as const;
                }
                txCore.metrics.txRuntime.registerFxserverRestart(issueSrc);
                this.triggerServerRestart(
                    issueMsg,
                    txCore.translator.t('restarter.hang_detected'),
                    timesPrefix,
                );
            }
        }
    }


    /**
     * Handles the HeartBeat event from the server.
     */
    handleHeartBeat(source: 'fd3' | 'http') {
        const tsNow = now();
        if (source === 'fd3') {
            if (
                this.swLastHTTP.started
                && this.swLastHTTP.elapsed > 15
                && this.swLastFD3.elapsed < 5
            ) {
                txCore.metrics.txRuntime.registerFxserverHealthIssue('http');
            }
            this.swLastFD3.restart();
        } else if (source === 'http') {
            if (
                this.swLastFD3.started
                && this.swLastFD3.elapsed > 15
                && this.swLastHTTP.elapsed < 5
            ) {
                txCore.metrics.txRuntime.registerFxserverHealthIssue('fd3');
            }
            this.swLastHTTP.restart();
        }
    }
};
