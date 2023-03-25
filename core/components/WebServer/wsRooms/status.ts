const modulename = 'SocketRoom:Status';
import TxAdmin from "@core/txAdmin";
import { RoomType } from "../webSocket";
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);


/**
 * Returns the Discord Bot data
 */
const prepareDiscordStatus = (txAdmin: TxAdmin) => {
    const wsStatus = txAdmin.discordBot.wsStatus;
    const statusCodes = [
        ['READY', 'success'],
        ['CONNECTING', 'warning'],
        ['RECONNECTING', 'warning'],
        ['IDLE', 'warning'],
        ['NEARLY', 'warning'],
        ['DISCONNECTED', 'danger'],
        ['WAITING_FOR_GUILDS', 'warning'],
        ['IDENTIFYING', 'warning'],
        ['RESUMING', 'warning'],
    ];

    if (wsStatus === false) {
        return {
            status: 'DISABLED',
            statusClass: 'secondary',
        };
    } else if (statusCodes[wsStatus]) {
        return {
            status: statusCodes[wsStatus][0],
            statusClass: statusCodes[wsStatus][1],
        };
    } else {
        return {
            status: 'UNKNOWN',
            statusClass: 'danger',
        };
    }
}


/**
 * Returns the fxserver's data
 */
const prepareServerStatus = (txAdmin: TxAdmin) => {
    const out = {
        mutex: txAdmin.fxRunner?.currentMutex,
        status: txAdmin.healthMonitor.currentStatus || '??',
        process: txAdmin.fxRunner.getStatus(),
        name: txAdmin.globalConfig.serverName,
        players: txAdmin.playerlistManager.onlineCount,
        scheduler: txAdmin.scheduler.getStatus(),
        statusClass: 'dark',
    };

    if (out.status == 'ONLINE') {
        out.statusClass = 'success';
    } else if (out.status == 'PARTIAL') {
        out.statusClass = 'warning';
    } else if (out.status == 'OFFLINE') {
        out.statusClass = 'danger';
    } else {
        out.statusClass = 'dark';
    }

    return out;
}


/**
 * Returns the host's usage
 */
const prepareHostData = (txAdmin: TxAdmin) => {
    const stats = txAdmin.healthMonitor.hostStats;
    if (!stats) {
        return {
            memory: { pct: 0, text: 'not available' },
            cpu: { pct: 0, text: 'not available' },
        };
    } else {
        return {
            memory: {
                pct: stats.memory.usage,
                text: `${stats.memory.usage}% (${stats.memory.used.toFixed(2)}/${stats.memory.total.toFixed(2)} GB)`,
            },
            cpu: {
                pct: stats.cpu.usage,
                text: `${stats.cpu.usage}% of ${stats.cpu.count}x ${stats.cpu.speed} MHz`,
            },
        };
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
        return {
            discord: prepareDiscordStatus(txAdmin), //passive update when HostData updates
            host: prepareHostData(txAdmin), //push
            server: prepareServerStatus(txAdmin),
        };
    },
})
