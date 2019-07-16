//Requires
const os = require('os');
const axios = require("axios");
const prettyBytes = require('pretty-bytes');
const pidusageTree = require('pidusage-tree');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const webUtils = require('./webUtils.js');
const Cache = require('../extras/dataCache');
const context = 'WebServer:getFullReport';

let cache = new Cache(10);


/**
 * Returns the output page containing the full report
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    let cacheData = cache.get();
    if(cacheData !== false){
        cacheData.message = 'This page was cached in the last 10 seconds';
        let out = await webUtils.renderMasterView('fullReport', cacheData);
        return res.send(out);
    }


    let timeStart = new Date();
    let data = {
        headerTitle: 'Full Report',
        message: '',
        host: {},
        fxserver: {},
        proccesses: [],
        config: {
            timeout: globals.monitor.config.timeout,
            failures: globals.monitor.config.restarter.failures,
            schedule: globals.monitor.config.restarter.schedule.join(', '),
            buildPath: globals.fxRunner.config.buildPath,
            basePath: globals.fxRunner.config.basePath,
            cfgPath: globals.fxRunner.config.cfgPath,
        }
    };

    [data.host, data.proccesses, data.fxserver] = await Promise.all([
        getHostData(),
        getProcessesData(),
        getFXServerData()
    ]);


    let timeElapsed = new Date() - timeStart;
    data.message = `Executed in ${timeElapsed} ms`;

    cache.set(data);
    let out = await webUtils.renderMasterView('fullReport', data);
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
                procName = 'Terminal';
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
                memory: prettyBytes(curr.memory),
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
    if(!globals.config.forceFXServerPort && !globals.fxRunner.fxServerPort){
        return {error: `Server Offline`}
    }
    let port = (globals.config.forceFXServerPort)? globals.config.forceFXServerPort : globals.fxRunner.fxServerPort;
    let requestOptions = {
        url: `http://localhost:${port}/info.json`,
        method: 'get',
        responseType: 'json',
        responseEncoding: 'utf8',
        maxRedirects: 0,
        timeout: globals.monitor.config.timeout
    }

    let fxData = {};
    try {
        let res = await axios(requestOptions);
        let data = res.data;

        fxData.statusColor = 'success';
        fxData.status = 'ONLINE';
        fxData.version = data.server;
        fxData.resources = data.resources.length;
        fxData.onesync = (data.vars && data.vars.onesync_enabled === 'true')? 'enabled' : 'disabled';
        fxData.maxClients = (data.vars && data.vars.sv_maxClients)? data.vars.sv_maxClients : '--';
        fxData.tags = (data.vars && data.vars.tags)? data.vars.tags : '--';
        fxData.error = false;
    } catch (error) {
        logError('Error getting FXServer data', context);
        if(globals.config.verbose) dir(error);
        fxData.error = `Failed to retrieve FXServer data. <br>The server must be online for this operation. <br>Check the terminal for more information (if verbosity is enabled)`;
    }

    return fxData;
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

        hostData.osType = `${os.type()} (${os.platform()})`;
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
