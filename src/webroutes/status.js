//Requires
const modulename = 'WebServer:GetStatus';
const os = require('os');
const clone = require('clone');
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);


/**
 * Getter for all the log/server/process data
 * @param {object} ctx
 */
module.exports = async function GetStatus(ctx) {
    return ctx.send({
        meta: prepareMetaData(),
        host: prepareHostData(),
        status: prepareServerStatus(),
        players: preparePlayersData()
    })
};


//==============================================================
/**
 * Returns the fxserver's data
 */
function prepareServerStatus() {
    let fxServerHitches = clone(globals.monitor.globalCounters.hitches);

    //processing hitches
    let now = (Date.now() / 1000).toFixed();
    let hitchTimeSum = 0;
    fxServerHitches.forEach((hitch, key) => {
        if (now - hitch.ts < 60) {
            hitchTimeSum += hitch.hitchTime;
        } else {
            delete (fxServerHitches[key]);
        }
    });

    //preparing hitch output string
    let hitches;
    if (hitchTimeSum > 5000) {
        let secs = (hitchTimeSum / 1000).toFixed();
        let pct = ((secs / 60) * 100).toFixed();
        hitches = `${secs}s/min (${pct}%)`;
    } else {
        hitches = hitchTimeSum + 'ms/min';
    }

    //preparing the rest of the strings
    let monitorStatus = globals.monitor.currentStatus || '??';
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
    let processStatus = globals.fxRunner.getStatus();

    let logFileSize = (
        globals.fxRunner &&
        globals.fxRunner.consoleBuffer &&
        globals.fxRunner.consoleBuffer.logFileSize
    )? globals.fxRunner.consoleBuffer.logFileSize : '--';


    let out = `<strong>Monitor Status: <span class="badge badge-${monitorStatusClass}"> ${monitorStatus} </span> </strong><br>
                <strong>Process Status:</strong> ${processStatus}<br>
                <strong>Hitch Time:</strong> ${hitches}<br>
                <strong>Log Size:</strong> ${logFileSize}`;
    return out;
}


//==============================================================
/**
 * Returns the host's usage
 */
function prepareHostData() {
    let giga = 1024 * 1024 * 1024;

    try {
        //processing host data
        let memFree = (os.freemem() / giga).toFixed(2);
        let memTotal = (os.totalmem() / giga).toFixed(2);
        let memUsed = (memTotal - memFree).toFixed(2);;
        let memUsage = ((memUsed / memTotal) * 100).toFixed(0);
        let cpus = os.cpus();
        let cpuStatus = globals.monitor.cpuStatusProvider.getUsageStats();
        let cpuUsage = cpuStatus.last10 || cpuStatus.full;

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
