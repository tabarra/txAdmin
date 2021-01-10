//Requires
const modulename = 'WebServer:GetStatus';
const os = require('os');
const si = require('systeminformation');
const cloneDeep = require('lodash/cloneDeep');
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);
const Cache = require('../extras/dataCache');

const hostDataCache = new Cache(5);


/**
 * Getter for all the log/server/process data
 * The host data is cached for 5 seconds
 * @param {object} ctx
 */
module.exports = async function GetStatus(ctx) {    
    let hostData = hostDataCache.get();
    if (hostData === false) {
        hostData = await prepareHostData();
        hostDataCache.set(hostData);
    }

    return ctx.send({
        meta: prepareMetaData(),
        host: hostData,
        status: prepareServerStatus(),
        players: preparePlayersData()
    })
};


//==============================================================
/**
 * Returns the fxserver's data
 */
function prepareServerStatus() {
    
    // //processing hitches
    // let fxServerHitches = cloneDeep(globals.monitor.globalCounters.hitches);
    // let now = (Date.now() / 1000).toFixed();
    // let hitchTimeSum = 0;
    // fxServerHitches.forEach((hitch, key) => {
    //     if (now - hitch.ts < 60) {
    //         hitchTimeSum += hitch.hitchTime;
    //     } else {
    //         delete (fxServerHitches[key]);
    //     }
    // });

    // //preparing hitch output string
    // let hitches;
    // if (hitchTimeSum > 5000) {
    //     let secs = (hitchTimeSum / 1000).toFixed();
    //     let pct = ((secs / 60) * 100).toFixed();
    //     hitches = `${secs}s/min (${pct}%)`;
    // } else {
    //     hitches = hitchTimeSum + 'ms/min';
    // }

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
    ]
    if(discordClient == null){
        discordStatus = 'DISABLED';
        discordStatusClass = 'secondary';

    }else if(discStatusCodes[discordClient.status]){
        discordStatus = discStatusCodes[discordClient.status][0];
        discordStatusClass = discStatusCodes[discordClient.status][1];

    }else{
        discordStatus = 'UNKNOWN';
        discordStatusClass = 'danger';
    }

    //Server status
    const monitorStatus = globals.monitor.currentStatus || '??';
    let monitorStatusClass;
    if(monitorStatus == 'ONLINE'){
        monitorStatusClass = 'success';
    }else if(monitorStatus == 'PARTIAL'){
        monitorStatusClass = 'warning';
    }else if(monitorStatus == 'OFFLINE'){
        monitorStatusClass = 'danger';
    }else{
        monitorStatusClass = 'dark';
    }
    const processStatus = globals.fxRunner.getStatus();

    let out = `Discord Bot Status: <span class="badge badge-${discordStatusClass}"> ${discordStatus} </span> <br>
        Server Status: <span class="badge badge-${monitorStatusClass}"> ${monitorStatus} </span> <br>
        Process Status: <span class="font-weight-light">${processStatus}</span>`;

    return out;
}


//==============================================================
/**
 * Returns the host's usage
 */
async function prepareHostData() {
    try {
        const giga = 1024 * 1024 * 1024;
        let memFree, memTotal, memUsed;
        if (GlobalData.osType === 'linux') {
            const memoryData = await si.mem();
            memFree = (memoryData.available / giga).toFixed(2);
            memTotal = (memoryData.total / giga).toFixed(2);
            memUsed = (memoryData.active / giga).toFixed(2);
        } else {
            memFree = (os.freemem() / giga).toFixed(2);
            memTotal = (os.totalmem() / giga).toFixed(2);
            memUsed = (memTotal - memFree).toFixed(2);
        }

        const memUsage = ((memUsed / memTotal) * 100).toFixed(0);
        const cpus = os.cpus();
        const cpuStatus = globals.monitor.cpuStatusProvider.getUsageStats();
        const cpuUsage = cpuStatus.last10 || cpuStatus.full;

        //returning output output
        return {
            memory: {
                pct: memUsage,
                text: `${memUsage}% (${memUsed}/${memTotal} GB)`
            },
            cpu:{
                pct: cpuUsage,
                text: `${cpuUsage}% of ${cpus.length}x ${cpus[0].speed} MHz`
            }
        }

    } catch (error) {
        if (GlobalData.verbose) {
            logError('Failed to execute prepareHostData()');
            dir(error);
        }
        return {
            memory: {
                pct: 0,
                text: `error`
            },
            cpu:{
                pct: 0,
                text: `error`
            }
        }
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
    if(globals.monitor.currentStatus == 'ONLINE'){
        favicon = 'favicon_online';
    }else if(globals.monitor.currentStatus == 'PARTIAL'){
        favicon = 'favicon_partial';
    }else{
        favicon = 'favicon_offline';
    }
    return {
        favicon,
        title: (globals.monitor.currentStatus == 'ONLINE') ? `(${globals.playerController.activePlayers.length}) txAdmin` : 'txAdmin'
    };
}
