//Requires
const os = require('os');
const prettyBytes = require('pretty-bytes');
const prettyMs = require('pretty-ms');
const pidusageTree = require('pidusage-tree');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const webUtils = require('./webUtils.js');
const context = 'WebServer:getFullReport';


/**
 * Returns the output page containing the full report
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    let timeStart = new Date();
    let out = '';
    let cpus;
    try {
        let giga = 1024 * 1024 * 1024;
        let memFree = (os.freemem() / giga).toFixed(2);
        let memTotal = (os.totalmem() / giga).toFixed(2);
        let memUsage = (((memTotal-memFree) / memTotal)*100).toFixed(0);
        let userInfo = os.userInfo()
        cpus = os.cpus();
    
        out += `<b>OS Type:</b> ${os.type()} (${os.platform()})\n`;
        out += `<b>OS Release:</b> ${os.release()}\n`;
        out += `<b>Username:</b> ${userInfo.username}\n`;
        out += `<b>Host CPUs:</b> ${cpus.length}x ${cpus[0].speed} MHz\n`;
        out += `<b>Host Memory:</b> ${memUsage}% (${memFree}/${memTotal} GB)\n`
        out += '\n<hr>';
    } catch (error) {
        logError('Error getting Host data', context);
        if(globals.config.verbose) dir(error);
        out += `Failed to retrieve host data. Check the terminal for more information (if verbosity is enabled)\n<hr>`;
    }


    let procList = await getProcessesData();
    procList.forEach(proc => {
        let relativeCPU = (proc.cpu/cpus.length).toFixed(2);
        out += `<b>Process:</b> ${proc.name}\n`;
        // out += `<b>PID:</b> ${proc.pid}\n`;
        out += `<b>Memory:</b> ${prettyBytes(proc.memory)}\n`;
        out += `<b>CPU:</b> ${relativeCPU}%\n`;
        out += '\n';
    });

    let timeElapsed = new Date() - timeStart;
    out += `\nExecuted in ${timeElapsed} ms`;
    return webUtils.sendOutput(res, out, {escape: false, center:false});
};


//================================================================
/**
 * Gets the Processes Data.
 */
async function getProcessesData(){
    let procList = [];
    try {
        var processes = await pidusageTree(process.pid);

        let termPID = Object.keys(processes).find((pid) => { return processes[pid].ppid == process.pid});
        let fxsvMainPID = Object.keys(processes).find((pid) => { return processes[pid].ppid == termPID});
        let fxsvRepPID = Object.keys(processes).find((pid) => { return processes[pid].ppid == fxsvMainPID});
       
        //Foreach PID
        Object.keys(processes).forEach((pid) => {
            var curr = processes[pid];

            //NOTE: Somehow this might happen in Linux
            if(curr === null) return;

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
                cpu: curr.cpu,
                memory: curr.memory,
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