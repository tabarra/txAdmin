const modulename = 'WebServer:GetStatus';
import logger from '@core/extras/console.js';
const { dir, log, logOk, logWarn, logError } = logger(modulename);


/**
 * Getter for all the log/server/process data
 * The host data is cached for 5 seconds
 * @param {object} ctx
 */
export default async function GetStatus(ctx) {
    const out = {
        discord: prepareDiscordStatus(),
        server: prepareServerStatus(),
    };
    if (ctx.params.scope === 'web') {
        out.host = prepareHostData();
        out.players = preparePlayersData();
    }
    return ctx.send(out);
};


//==============================================================
/**
 * Returns the Discord Bot data
 */
function prepareDiscordStatus() {
    const client = globals.discordBot.client;
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

    if (client == null) {
        return {
            status: 'DISABLED',
            statusClass: 'secondary',
        };
    } else if (statusCodes[client.ws?.status]) {
        return {
            status: statusCodes[client.ws?.status][0],
            statusClass: statusCodes[client.ws?.status][1],
        };
    } else {
        return {
            status: 'UNKNOWN',
            statusClass: 'danger',
        };
    }
}


//==============================================================
/**
 * Returns the fxserver's data
 */
function prepareServerStatus() {
    const out = {
        status: globals.healthMonitor.currentStatus || '??',
        process: globals.fxRunner.getStatus(),
        name: globals.config.serverName,
        scheduler: globals.scheduler.getStatus(),
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


//==============================================================
/**
 * Returns the host's usage
 */
function prepareHostData() {
    const stats = globals.healthMonitor.hostStats;
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


//==============================================================
/**
 * Returns the activePlayers list in /playerlist.json compatible-ish format
 *
 * FIXME: This is very wasteful, we need to start only sending the playerlist diff for the admins.
 *        Could be done via socket.io, and then playerlist changed would push update events
 */
function preparePlayersData() {
    return globals.playerController.getPlayerList();
}
