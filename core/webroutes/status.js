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
        status: prepareServerStatus(),
    };
    if (ctx.params.scope === 'web') {
        out.host = prepareHostData();
        out.meta = prepareMetaData();
        out.players = preparePlayersData();
    }
    return ctx.send(out);
};


//==============================================================
/**
 * Returns the fxserver's data
 */
function prepareServerStatus() {
    //Discord status
    const discord = {};
    const discordClient = globals.discordBot.client;
    const discStatusCodes = [
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
    if (discordClient == null) {
        discord.status = 'DISABLED';
        discord.class = 'secondary';
    } else if (discStatusCodes[discordClient.ws?.status]) {
        discord.status = discStatusCodes[discordClient.ws?.status][0];
        discord.class = discStatusCodes[discordClient.ws?.status][1];
    } else {
        discord.status = 'UNKNOWN';
        discord.class = 'danger';
    }

    //Server status
    const server = {
        status: globals.healthMonitor.currentStatus || '??',
        process: globals.fxRunner.getStatus(),
    };
    if (server.status == 'ONLINE') {
        server.class = 'success';
    } else if (server.status == 'PARTIAL') {
        server.class = 'warning';
    } else if (server.status == 'OFFLINE') {
        server.class = 'danger';
    } else {
        server.class = 'dark';
    }

    //Scheduler status
    const scheduler = globals.scheduler.getStatus();

    return {
        discord,
        server,
        scheduler
    };
}


//==============================================================
/**
 * Returns the host's usage
 */
function prepareHostData() {
    const stats = globals.healthMonitor.hostStats;
    if (!stats) {
        return {
            memory: {pct: 0, text: 'not available'},
            cpu: {pct: 0, text: 'not available'},
        };
    } else {
        return {
            memory: {
                pct: stats.memory.usage,
                text: `${stats.memory.usage}% (${stats.memory.used.toFixed(2)}/${stats.memory.total.toFixed(2)} GB)`,
            },
            cpu:{
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


//==============================================================
/**
 * Returns the page metadata (title and icon)
 * FIXME: deprecate
 */
function prepareMetaData() {
    let favicon;
    if (globals.healthMonitor.currentStatus == 'ONLINE') {
        favicon = 'favicon_online';
    } else if (globals.healthMonitor.currentStatus == 'PARTIAL') {
        favicon = 'favicon_partial';
    } else {
        favicon = 'favicon_offline';
    }
    return {
        favicon,
        title: (globals.healthMonitor.currentStatus == 'ONLINE')
            ? `(${globals.playerController.activePlayers.length}) txAdmin`
            : 'txAdmin',
    };
}
