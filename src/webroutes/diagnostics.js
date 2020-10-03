//Requires
const modulename = 'WebServer:Diagnostics';
const os = require('os');
const si = require('systeminformation');
const axios = require("axios");
const bytes = require('bytes');
const pidusageTree = require('pidusage-tree');
const humanizeDuration = require('humanize-duration');
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);
const Cache = require('../extras/dataCache');

const cache = new Cache(5);


/**
 * Returns the output page containing the full report
 * @param {object} ctx
 */
module.exports = async function Diagnostics(ctx) {
    const cachedData = cache.get();
    if(cachedData !== false){
        cachedData.message = 'This page was cached in the last 5 seconds';
        return ctx.utils.render('diagnostics', cachedData);
    }

    const timeStart = Date.now();
    const data = {
        headerTitle: 'Full Report',
        message: ''
    };
    [data.host, data.txadmin, data.fxserver, data.proccesses] = await Promise.all([
        getHostData(),
        gettxAdminData(),
        getFXServerData(),
        getProcessesData(),
    ]);

    const timeElapsed = Date.now() - timeStart;
    data.message = `Executed in ${timeElapsed} ms`;

    cache.set(data);
    return ctx.utils.render('diagnostics', data);
};


//================================================================
/**
 * Gets the Processes Data.
 * TODO: get process name with wmic
 *       wmic PROCESS get "Name,ParentProcessId,ProcessId,CommandLine,CreationDate,UserModeTime,WorkingSetSize"
 */
async function getProcessesData(){
    const procList = [];
    try {
        const processes = await pidusageTree(process.pid);

        //NOTE: Cleaning invalid proccesses that might show up in Linux
        Object.keys(processes).forEach((pid) => {
            if(processes[pid] === null) delete processes[pid];
        });

        //Foreach PID
        Object.keys(processes).forEach((pid) => {
            const curr = processes[pid];

            //Define name and order
            let procName;
            let order = process.timestamp || 1;
            if(pid == process.pid){
                procName = 'FxMonitor + txAdmin';
                order = 0;
            }else if(curr.memory <= 10*1024*1024){
                procName = 'FXServer MiniDump';
            }else{
                procName = 'FXServer';
            }

            procList.push({
                pid: pid,
                ppid: (curr.ppid == process.pid)? 'txAdmin' : curr.ppid,
                name: procName,
                cpu: (curr.cpu).toFixed(2) + '%',
                memory: bytes(curr.memory),
                order: order
            });
        });

    } catch (error) {
        logError(`Error getting processes data.`);
        if(GlobalData.verbose) dir(error);
    }

    //Sort procList array
    procList.sort(( a, b ) => {
        if ( a.order < b.order )  return -1;
        if ( a.order > b.order ) return 1;
        return 0;
    })


    return procList;
}


//================================================================
/**
 * Gets the FXServer Data.
 */
async function getFXServerData(){
    //Sanity Check
    if(!globals.config.forceFXServerPort && !globals.fxRunner.fxServerPort){
        return {error: `Server Offline`}
    }

    //Preparing request
    const port = (globals.config.forceFXServerPort)? globals.config.forceFXServerPort : globals.fxRunner.fxServerPort;
    const requestOptions = {
        url: `http://localhost:${port}/info.json`,
        method: 'get',
        responseType: 'json',
        responseEncoding: 'utf8',
        maxRedirects: 0,
        timeout: globals.monitor.config.timeout
    }
    
    //Making HTTP Request
    let infoData;
    try {
        const res = await axios(requestOptions);
        infoData = res.data;
    } catch (error) {
        logWarn('Failed to get FXServer information.');
        if(GlobalData.verbose) dir(error);
        return {error: `Failed to retrieve FXServer data. <br>The server must be online for this operation. <br>Check the terminal for more information (if verbosity is enabled)`};
    }

    //Helper function
    const getBuild = (ver)=>{
        try {
            const regex = /v1\.0\.0\.(\d{4,5})\s*/;
            const res = regex.exec(ver);
            return parseInt(res[1]);
        } catch (error) {
            return 0;
        }
    }

    //Processing result
    try {
        let versionWarning;
        if(getBuild(infoData.server) !== GlobalData.fxServerVersion){
            versionWarning = `<span class="badge badge-danger"> INCOMPATIBLE </span>`;
        }

        let resourcesWarning;
        if(infoData.resources.length <= 100){
            resourcesWarning = '';
        }else if(infoData.resources.length < 200){
            resourcesWarning = `<span class="badge badge-warning"> HIGH </span>`;
        }else{
            resourcesWarning = `<span class="badge badge-danger"> VERY HIGH! </span>`;
        }

        return {
            error: false,
            statusColor: 'success',
            status: ' ONLINE ',
            version: infoData.server,
            versionWarning: versionWarning || '',
            resources: infoData.resources.length,
            resourcesWarning: resourcesWarning,
            onesync: (infoData.vars && infoData.vars.onesync_enabled === 'true')? 'enabled' : 'disabled',
            maxClients: (infoData.vars && infoData.vars.sv_maxClients)? infoData.vars.sv_maxClients : '--',
            txAdminVersion: (infoData.vars && infoData.vars['txAdmin-version'])? infoData.vars['txAdmin-version'] : '--',
        };
    } catch (error) {
        logWarn('Failed to process FXServer information.');
        if(GlobalData.verbose) dir(error);
        return {error: `Failed to process FXServer data. <br>Check the terminal for more information (if verbosity is enabled)`};
    }
}


//================================================================
/**
 * Gets the Host Data.
 */
async function getHostData(){
    const hostData = {};
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
        const userInfo = os.userInfo();
        const cpus = os.cpus();

        let clockWarning;
        if(cpus[0].speed <= 2400){
            clockWarning = '<span class="badge badge-danger"> VERY SLOW! </span>';
        }else if(cpus[0].speed < 3000){
            clockWarning = `<span class="badge badge-warning"> SLOW </span>`;
        }else{
            clockWarning = ``;
        }

        hostData.nodeVersion = process.version;
        hostData.osType = `${os.type()} (${os.platform()}/${process.arch})`;
        hostData.osRelease = `${os.release()}`;
        hostData.username = `${userInfo.username}`;
        hostData.clockWarning = clockWarning;
        hostData.cpus = `${cpus.length}x ${cpus[0].speed} MHz`;
        hostData.memory = `${memUsage}% (${memUsed}/${memTotal} GB)`;
        hostData.error  = false;
    } catch (error) {
        logError('Error getting Host data');
        if(GlobalData.verbose) dir(error);
        hostData.error = `Failed to retrieve host data. <br>Check the terminal for more information (if verbosity is enabled)`;
    }

    return hostData;
}


//================================================================
/**
 * Gets txAdmin Data
 */
async function gettxAdminData(){
    const humanizeOptions = {
        round: true,
        units: ['d', 'h', 'm']
    }

    const controllerConfigs = globals.playerController.config;
    return {
        uptime: humanizeDuration(process.uptime()*1000, humanizeOptions),
        cfxUrl: (GlobalData.cfxUrl)? `https://${GlobalData.cfxUrl}/` : '--',
        banlistEnabled: controllerConfigs.onJoinCheckBan.toString(),
        whitelistEnabled: controllerConfigs.onJoinCheckWhitelist.toString(),
        fullCrashes: globals.monitor.globalCounters.fullCrashes,
        partialCrashes: globals.monitor.globalCounters.partialCrashes,
        timeout: globals.monitor.config.timeout,
        cooldown: globals.monitor.config.cooldown,
        schedule: globals.monitor.config.restarterSchedule.join(', ') || '--',
        fxServerPath: GlobalData.fxServerPath,
        serverDataPath: globals.fxRunner.config.serverDataPath,
        cfgPath: globals.fxRunner.config.cfgPath,
    };
}
