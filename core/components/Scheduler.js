const modulename = 'Scheduler';
import logger from '@core/extras/console.js';
import { parseSchedule } from '@core/extras/helpers';
import { verbose } from '@core/globalData.js';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

//Helpers
const scheduleWarnings = [30, 15, 10, 5, 4, 3, 2, 1];

/**
 * Processes an array of HH:MM, gets the next timestamp (sorted by closest).
 * When time matches, it will be dist: 0, distMins: 0, and nextTs likely in the past due to seconds and milliseconds being 0.
 * @param {Array} schedule 
 * @returns {Object} {string, minuteFloorTs}
 */
const getNextScheduled = (parsedSchedule) => {
    const thisMinuteTs = new Date().setSeconds(0, 0);
    const processed = parsedSchedule.map((t) => {
        const nextDate = new Date();
        let minuteFloorTs = nextDate.setHours(t.hours, t.minutes, 0, 0);
        if (minuteFloorTs < thisMinuteTs) {
            minuteFloorTs = nextDate.setHours(t.hours + 24, t.minutes, 0, 0);
        }
        return {
            string: t.string,
            minuteFloorTs,
        };
    });
    return processed.sort((a, b) => a.minuteFloorTs - b.minuteFloorTs)[0];
};


export default class Scheduler {
    constructor(config) {
        this.config = config;
        this.nextSkip = false;
        this.nextTempSchedule = false;
        this.calculatedNextRestartMinuteFloorTs = false;
        this.checkSchedule();

        //Cron Function 
        setInterval(() => {
            this.checkSchedule();
        }, 60 * 1000);
    }


    /**
     * Refresh configs, resets skip and temp scheduled, runs checkSchedule.
     */
    refreshConfig() {
        this.config = globals.configVault.getScoped('monitor');
        this.nextSkip = false;
        this.nextTempSchedule = false;
        this.checkSchedule();
    }

    /**
     * Returns the current status of scheduler
     * NOTE: sending relative because server might have clock skew
     */
    getStatus() {
        if (this.calculatedNextRestartMinuteFloorTs) {
            const thisMinuteTs = new Date().setSeconds(0, 0);
            return {
                nextRelativeMs: this.calculatedNextRestartMinuteFloorTs - thisMinuteTs,
                nextSkip: this.nextSkip === this.calculatedNextRestartMinuteFloorTs,
                nextIsTemp: !!this.nextTempSchedule,
            };
        } else {
            return {
                nextRelativeMs: false,
                nextSkip: false,
                nextIsTemp: false,
            };
        }
    }


    /**
     * Sets this.nextSkip.
     * Cancel scheduled button -> setNextSkip(true)
     * Enable scheduled button -> setNextSkip(false)
     * @param {Boolean} enabled 
     */
    setNextSkip(enabled) {
        if (enabled) {
            if (this.nextTempSchedule) {
                this.nextTempSchedule = false;
            } else if (this.calculatedNextRestartMinuteFloorTs) {
                this.nextSkip = this.calculatedNextRestartMinuteFloorTs;
            }
        } else {
            this.nextSkip = false;
        }

        //This is needed to refresh this.calculatedNextRestartMinuteFloorTs
        this.checkSchedule();
    }


    /**
     * Sets this.nextTempSchedule.
     * The value MUST be before the next setting scheduled time.
     * @param {String} timeString 
     */
    setNextTempSchedule(timeString) {
        //Process input
        if (typeof timeString !== 'string') throw new Error(`expected string`);
        const [hours, minutes] = timeString.split(':', 2).map(x => parseInt(x));
        if (typeof hours === 'undefined' || isNaN(hours) || hours < 0 || hours > 23) throw new Error(`invalid hours`);
        if (typeof minutes === 'undefined' || isNaN(minutes) || minutes < 0 || minutes > 59) throw new Error(`invalid minutes`);
        const thisMinuteTs = new Date().setSeconds(0, 0);
        const nextDate = new Date();
        let minuteFloorTs = nextDate.setHours(hours, minutes, 0, 0);
        if (minuteFloorTs < thisMinuteTs) {
            minuteFloorTs = nextDate.setHours(hours + 24, minutes, 0, 0);
        }

        //Check validity
        if (Array.isArray(this.config.restarterSchedule) && this.config.restarterSchedule.length) {
            const parsed = parseSchedule(this.config.restarterSchedule);
            const nextSettingRestart = getNextScheduled(parsed);
            if (nextSettingRestart.minuteFloorTs < minuteFloorTs) {
                throw new Error(`You already have one restart scheduled before that at ${nextSettingRestart.string}.`);
            }
        }

        // Set next temp schedule
        this.nextTempSchedule = {
            string: hours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0'),
            minuteFloorTs,
        };

        //This is needed to refresh this.calculatedNextRestartMinuteFloorTs
        this.checkSchedule();
    }


    /**
     * Checks the schedule to see if it's time to announce or restart the server
     */
    async checkSchedule() {
        //Check settings and temp scheduled restart
        let nextRestart;
        if (this.nextTempSchedule) {
            nextRestart = this.nextTempSchedule;
        } else if (Array.isArray(this.config.restarterSchedule) && this.config.restarterSchedule.length) {
            const parsed = parseSchedule(this.config.restarterSchedule);
            nextRestart = getNextScheduled(parsed);
        } else {
            //nothing scheduled
            this.calculatedNextRestartMinuteFloorTs = false;
            return;
        }
        this.calculatedNextRestartMinuteFloorTs = nextRestart.minuteFloorTs;

        //Checking if skipped
        if (this.nextSkip === this.calculatedNextRestartMinuteFloorTs) {
            if (verbose) log(`Skipping next scheduled restart`);
            return;
        }
        
        //Calculating dist
        const thisMinuteTs = new Date().setSeconds(0, 0);
        const nextDistMs = nextRestart.minuteFloorTs - thisMinuteTs;
        const nextDistMins = Math.floor(nextDistMs / 60_000);

        //Checking if server restart or warning time
        if (nextDistMins === 0) {
            //restart server
            this.restartFXServer(
                `scheduled restart at ${nextRestart.string}`,
                globals.translator.t('restarter.schedule_reason', { time: nextRestart.string }),
            );

            //reset next scheduled
            this.nextTempSchedule = false;

        } else if (scheduleWarnings.includes(nextDistMins)) {
            const tOptions = {
                smart_count: nextDistMins,
                servername: globals.config.serverName,
            };

            //Send discord warning
            const discordMsg = globals.translator.t('restarter.schedule_warn_discord', tOptions);
            globals.discordBot.sendAnnouncement(discordMsg);

            // Dispatch `txAdmin:events:announcement`
            //TODO: remove disableChatWarnings?
            if (!this.config.disableChatWarnings) {
                const serverMsg = globals.translator.t('restarter.schedule_warn', tOptions);
                globals.fxRunner.sendEvent('announcement', {
                    author: 'txAdmin',
                    message: serverMsg,
                });
            }

            //Dispatch `txAdmin:events:scheduledRestart` 
            globals.fxRunner.sendEvent('scheduledRestart', {
                secondsRemaining: nextDistMins * 60,
            });
        }
    }


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
        const logMessage = `Restarting server (${reasonInternal}).`;
        globals.logger.admin.write(`[SCHEDULER] ${logMessage}`);
        globals.fxRunner.restartServer(reasonTranslated, null);
        logWarn(logMessage);
    }
};
