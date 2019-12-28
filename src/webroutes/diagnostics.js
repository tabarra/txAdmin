//Requires
const os = require('os');
const axios = require("axios");
const bytes = require('bytes');
const pidusageTree = require('pidusage-tree');
const humanizeDuration = require('humanize-duration');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const webUtils = require('./webUtils.js');
const Cache = require('../extras/dataCache');
const context = 'WebServer:Diagnostics';

let cache = new Cache(5);


/**
 * Returns the output page containing the full report
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    let cacheData = cache.get();
    if(cacheData !== false){
        cacheData.message = 'This page was cached in the last 5 seconds';
        let out = await webUtils.renderMasterView('diagnostics', req.session, cacheData);
        return res.send(out);
    }


    let timeStart = new Date();
    let data = {
        headerTitle: 'Full Report',
        message: ''
    };

    [data.host, data.txadmin, data.fxserver, data.proccesses] = await Promise.all([
        getHostData(),
        gettxAdminData(),
        getFXServerData(),
        getProcessesData(),
    ]);


    let timeElapsed = new Date() - timeStart;
    data.message = `Executed in ${timeElapsed} ms`;

    cache.set(data);
    let out = await webUtils.renderMasterView('diagnostics', req.session, data);
    return res.send(out);
};


//================================================================
/**
 * Gets the Processes Data.
 */
async function getProcessesData(){
    let procList = [];
    try {
        let cpus = os.cpus();
        var processes = await pidusageTree(process.pid);

        //NOTE: Cleaning invalid proccesses that might show up in Linux
        Object.keys(processes).forEach((pid) => {
            if(processes[pid] === null) delete processes[pid];
        });

        let termPID = Object.keys(processes).find((pid) => { return processes[pid].ppid == process.pid});
        let fxsvMainPID = Object.keys(processes).find((pid) => { return processes[pid].ppid == termPID});
        let fxsvRepPID = Object.keys(processes).find((pid) => { return processes[pid].ppid == fxsvMainPID});

        //Foreach PID
        Object.keys(processes).forEach((pid) => {
            var curr = processes[pid];

            //Define name and order
            let procName;
            let order;
            if(pid == process.pid){
                procName = 'txAdmin';
                order = 0;

            }else if(pid == termPID){
                if(globals.config.osType === 'Linux' && Object.keys(processes).length == 2){
                    procName = 'FXServer';
                }else{
                    procName = 'Terminal';
                }
                order = 1;

            }else if(pid == fxsvMainPID){
                procName = 'FXServer Main';
                order = 2;

            }else if(pid == fxsvRepPID){
                procName = 'FXServer Dump';
                order = 3;

            }else{
                procName = 'Unknown';
                order = 9;
            }

            procList.push({
                pid: pid,
                name: procName,
                cpu: (curr.cpu/cpus.length).toFixed(2) + '%',
                memory: bytes(curr.memory),
                order: order
            });
        });

    } catch (error) {
        logError(`Error getting processes data.`, context);
        if(globals.config.verbose) dir(error);
    }

    //Sort procList array
    procList.sort(( a, b ) => {
        if ( a.order < b.order ){
            return -1;
        }
        if ( a.order > b.order ){
            return 1;
        }
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
    let port = (globals.config.forceFXServerPort)? globals.config.forceFXServerPort : globals.fxRunner.fxServerPort;
    let requestOptions = {
        url: `http://localhost:${port}/info.json`,
        method: 'get',
        responseType: 'json',
        responseEncoding: 'utf8',
        maxRedirects: 0,
        timeout: globals.monitor.config.timeout
    }
    let infoData;

    //Making HTTP Request
    try {
        let res = await axios(requestOptions);
        infoData = res.data;
    } catch (error) {
        logWarn('Failed to get FXServer information.', context);
        if(globals.config.verbose) dir(error);
        return {error: `Failed to retrieve FXServer data. <br>The server must be online for this operation. <br>Check the terminal for more information (if verbosity is enabled)`};
    }

    //Helper function
    const getBuild = (ver)=>{
        try {
            let regex = /v1\.0\.0\.(\d{4,5})\s*/;
            let res = regex.exec(ver);
            return parseInt(res[1]);
        } catch (error) {
            return 0;
        }
    }

    //Processing result
    try {
        let versionWarning;
        if(getBuild(infoData.server) < 1543){
            versionWarning = `<span class="badge badge-danger"> INCOMPATIBLE </span>`;
        }

        let fxData = {
            error: false,
            statusColor: 'success',
            status: ' ONLINE ',
            version: infoData.server,
            versionWarning: versionWarning || '',
            resources: infoData.resources.length,
            onesync: (infoData.vars && infoData.vars.onesync_enabled === 'true')? 'enabled' : 'disabled',
            maxClients: (infoData.vars && infoData.vars.sv_maxClients)? infoData.vars.sv_maxClients : '--',
        };

        return fxData;
    } catch (error) {
        logWarn('Failed to process FXServer information.', context);
        if(globals.config.verbose) dir(error);
        return {error: `Failed to process FXServer data. <br>Check the terminal for more information (if verbosity is enabled)`};
    }
}


//================================================================
/**
 * Gets the Host Data.
 */
async function getHostData(){
    let hostData = {};
    try {
        let giga = 1024 * 1024 * 1024;
        let memFree = (os.freemem() / giga).toFixed(2);
        let memTotal = (os.totalmem() / giga).toFixed(2);
        let memUsed = (memTotal-memFree).toFixed(2);;
        let memUsage = ((memUsed / memTotal)*100).toFixed(0);
        let userInfo = os.userInfo()
        let cpus = os.cpus();

        hostData.nodeVersion = process.version;
        hostData.osType = `${os.type()} (${os.platform()}/${process.arch})`;
        hostData.osRelease = `${os.release()}`;
        hostData.username = `${userInfo.username}`;
        hostData.cpus = `${cpus.length}x ${cpus[0].speed} MHz`;
        hostData.memory = `${memUsage}% (${memUsed}/${memTotal} GB)`;
        hostData.error  = false;
    } catch (error) {
        logError('Error getting Host data', context);
        if(globals.config.verbose) dir(error);
        hostData.error = `Failed to retrieve host data. <br>Check the terminal for more information (if verbosity is enabled)`;
    }

    return hostData;
}


//================================================================
/**
 * Gets txAdmin Data
 */
async function gettxAdminData(){
    let humanizeOptions = {
        language: globals.translator.t('$meta.humanizer_language'),
        round: true,
        units: ['d', 'h', 'm'],
        fallbacks: ['en']
    }

    let txadminData = {
        uptime: humanizeDuration(process.uptime()*1000, humanizeOptions),
        fullCrashes: globals.monitor.globalCounters.fullCrashes,
        partialCrashes: globals.monitor.globalCounters.partialCrashes,
        timeout: globals.monitor.config.timeout,
        failures: globals.monitor.config.restarter.failures,
        schedule: globals.monitor.config.restarter.schedule.join(', '),
        buildPath: globals.fxRunner.config.buildPath,
        basePath: globals.fxRunner.config.basePath,
        cfgPath: globals.fxRunner.config.cfgPath,
    };

    return txadminData;
}
