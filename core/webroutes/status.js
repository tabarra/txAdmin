//Requires
const modulename = 'WebServer:GetStatus';
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);


/**
 * Getter for all the log/server/process data
 * The host data is cached for 5 seconds
 * @param {object} ctx
 */
module.exports = async function GetStatus(ctx) {
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
    const discordClient = globals.discordBot.client;
    let discordStatus;
    let discordStatusClass;
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
        discordStatus = 'DISABLED';
        discordStatusClass = 'secondary';
    } else if (discStatusCodes[discordClient.ws?.status]) {
        discordStatus = discStatusCodes[discordClient.ws?.status][0];
        discordStatusClass = discStatusCodes[discordClient.ws?.status][1];
    } else {
        discordStatus = 'UNKNOWN';
        discordStatusClass = 'danger';
    }

    //Server status
    const monitorStatus = globals.monitor.currentStatus || '??';
    let monitorStatusClass;
    if (monitorStatus == 'ONLINE') {
        monitorStatusClass = 'success';
    } else if (monitorStatus == 'PARTIAL') {
        monitorStatusClass = 'warning';
    } else if (monitorStatus == 'OFFLINE') {
        monitorStatusClass = 'danger';
    } else {
        monitorStatusClass = 'dark';
    }
    const processStatus = globals.fxRunner.getStatus();

    return `Discord Bot Status: <span class="badge badge-${discordStatusClass}"> ${discordStatus} </span> <br>
        Server Status: <span class="badge badge-${monitorStatusClass}"> ${monitorStatus} </span> <br>
        Process Status: <span class="font-weight-light">${processStatus}</span>`;
}


//==============================================================
/**
 * Returns the host's usage
 */
function prepareHostData() {
    const stats = globals.monitor.hostStats;
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
 */
function prepareMetaData() {
    let favicon;
    if (globals.monitor.currentStatus == 'ONLINE') {
        favicon = 'favicon_online';
    } else if (globals.monitor.currentStatus == 'PARTIAL') {
        favicon = 'favicon_partial';
    } else {
        favicon = 'favicon_offline';
    }
    return {
        favicon,
        title: (globals.monitor.currentStatus == 'ONLINE')
            ? `(${globals.playerController.activePlayers.length}) txAdmin`
            : 'txAdmin',
    };
}
