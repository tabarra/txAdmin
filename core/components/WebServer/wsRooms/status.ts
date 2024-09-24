const modulename = 'SocketRoom:Status';
import TxAdmin from "@core/txAdmin";
import { RoomType } from "../webSocket";
import consoleFactory from '@extras/console';
import { GlobalStatusType, ServerConfigPendingStepType } from "@shared/socketioTypes";
const console = consoleFactory(modulename);


/**
 * Returns the fxserver's data
 */
const getInitialData = (txAdmin: TxAdmin): GlobalStatusType => {
    // Check if the deployer is running or setup is pending
    let configPendingStep: ServerConfigPendingStepType;
    if (globals.deployer !== null) {
        configPendingStep = 'deployer';
    } else if (!globals.fxRunner.config.serverDataPath || !globals.fxRunner.config.cfgPath) {
        configPendingStep = 'setup';
    }

    return {
        // @ts-ignore simplifying the status enum to a string
        discord: txAdmin.discordBot.wsStatus, //no push events, only passively updated
        server: {
            configPendingStep,
            status: txAdmin.healthMonitor.currentStatus || '??',
            process: txAdmin.fxRunner.getStatus(),
            instantiated: !!txAdmin.fxRunner.fxChild, //used to disable the control buttons
            name: txAdmin.globalConfig.serverName,
            whitelist: txAdmin.playerDatabase.config.whitelistMode,
            cpxRaces: txAdmin.fxRunner.getCpxRaceStatus(),
        },
        // @ts-ignore scheduler type narrowing id wrong because cant use "as const" in javascript
        scheduler: txAdmin.scheduler.getStatus(), //no push events, only passively updated
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
export default (txAdmin: TxAdmin): RoomType => ({
    permission: true, //everyone can see it
    eventName: 'status',
    cumulativeBuffer: false,
    outBuffer: null,
    initialData: () => {
        return getInitialData(txAdmin);
    },
})
