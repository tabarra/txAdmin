const modulename = 'SocketRoom:Status';
import { RoomType } from "../webSocket";
import consoleFactory from '@lib/console';
import { GlobalStatusType, ServerConfigPendingStepType } from "@shared/socketioTypes";
const console = consoleFactory(modulename);


/**
 * Returns the fxserver's data
 */
const getInitialData = (): GlobalStatusType => {
    // Check if the deployer is running or setup is pending
    let configPendingStep: ServerConfigPendingStepType;
    if (txManager.deployer !== null) {
        configPendingStep = 'deployer';
    } else if (!txConfig.fxRunner.serverDataPath || !txConfig.fxRunner.cfgPath) {
        configPendingStep = 'setup';
    }

    return {
        // @ts-ignore simplifying the status enum to a string
        discord: txCore.discordBot.wsStatus, //no push events, only passively updated
        server: {
            configPendingStep,
            status: txCore.healthMonitor.currentStatus || '??',
            process: txCore.fxRunner.getStatus(),
            instantiated: !!txCore.fxRunner.fxChild, //used to disable the control buttons
            name: txConfig.global.serverName,
            whitelist: txConfig.playerDatabase.whitelistMode,
        },
        // @ts-ignore scheduler type narrowing id wrong because cant use "as const" in javascript
        scheduler: txCore.scheduler.getStatus(), //no push events, only passively updated
    }
}


/**
 * The main room is joined automatically in every txadmin page (except solo ones)
 * It relays tx and server status data.
 * 
 * NOTE: 
 * - active push event for HealthMonitor, HostData, fxserver process
 * - passive update for discord status, scheduler
 * - the passive ones will be sent every 5 seconds anyways due to HostData updates
 */
export default {
    permission: true, //everyone can see it
    eventName: 'status',
    cumulativeBuffer: false,
    outBuffer: null,
    initialData: () => {
        return getInitialData();
    },
} satisfies RoomType;
