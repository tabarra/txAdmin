const modulename = 'Scheduler';
import humanizeDuration from 'humanize-duration';
import logger from '@core/extras/console.js';
import { parseSchedule } from '@core/extras/helpers';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

//Helpers
const scheduleWarnings = [30, 15, 10, 5, 4, 3, 2, 1];

const processSchedule = (schedule) => {
    const parsed = parseSchedule(schedule);
    const thisMinuteTs = new Date().setSeconds(0, 0);

    return parsed.map((t) => {
        t.nextDate = new Date();
        t.nextTs = t.nextDate.setHours(t.hour, t.minute, 0, 0);
        if (t.nextTs < thisMinuteTs) {
            t.nextTs = t.nextDate.setHours(t.hour + 24, t.minute, 0, 0);
        }
        t.localeString = t.nextDate.toLocaleString();
        t.dist = t.nextTs - thisMinuteTs;
        t.distString = humanizeDuration(t.dist);
        t.distMins = Math.floor(t.dist / 60_000);
        t.timeString = t.hour.toString().padStart(2, '0') + ':' + t.minute.toString().padStart(2, '0');
        return t;
    }).sort((a, b) => a.nextTs - b.nextTs);
};


export default class Scheduler {
    constructor(config) {
        this.config = config;
        this.nextSkip = false;
        this.nextDelay = null;

        //Cron Function 
        setInterval(() => {
            this.checkSchedule();
        }, 60 * 1000);
    }

    /**
     * Refresh Monitor configurations
     */
     refreshConfig() {
        this.config = globals.configVault.getScoped('monitor');
        this.checkSchedule();
    }


    /**
     * Checks the schedule to see if it's time to announce or restart the server
     */
    async checkSchedule() {
        if (!Array.isArray(this.config.restarterSchedule) || !this.config.restarterSchedule.length) return;

        const processed = processSchedule(this.config.restarterSchedule);
        const nextRestart = processed[0];

        if (nextRestart.distMins === 0) {
            //restart server
            this.restartFXServer(
                `scheduled restart at ${nextRestart.timeString}`,
                globals.translator.t('restarter.schedule_reason', { time: nextRestart.timeString }),
            );


        } else if (scheduleWarnings.includes(nextRestart.distMins)) {
            const tOptions = {
                smart_count: nextRestart.distMins,
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
                secondsRemaining: nextRestart.distMins * 60,
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
