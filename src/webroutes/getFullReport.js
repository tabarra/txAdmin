//Requires
const xss = require("xss");
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
    let out = await getServerStatus();
    return webUtils.sendOutput(res, out, {escape: false});
};


//==============================================================
async function getServerStatus(){
    let dataProcess = await refreshProcessStatus(); //shorthand much!?

    let out = '';
    let count = (dataProcess && typeof dataProcess.count !== 'undefined')? dataProcess.count : '--' ;
    let cpu = (dataProcess && typeof dataProcess.cpu !== 'undefined')? dataProcess.cpu.toFixed(2)+'%' : '--' ;
    let memory = (dataProcess && typeof dataProcess.memory !== 'undefined')? prettyBytes(dataProcess.memory) : '--' ;
    let uptime = (dataProcess && typeof dataProcess.uptime !== 'undefined')? prettyMs(dataProcess.uptime) : '--' ;
    out += `<b>Processes:</b> ${count}\n`;
    out += `<b>CPU:</b> ${cpu}\n`;
    out += `<b>Memory:</b> ${memory}\n`;
    out += `<b>Uptime:</b> ${uptime}\n`;
    out += '';

    return out;
}


//================================================================
/**
 * Refreshes the Processes Statuses.
 */
async function refreshProcessStatus(){
    try {
        var processes = await pidusageTree(process.pid);
        // let processes = {}
        let combined = {
            count: 0,
            cpu: 0,
            memory: 0,
            uptime: 0
        }
        let individual = {}

        //Foreach PID
        Object.keys(processes).forEach((pid) => {
            var curr = processes[pid];

            //NOTE: Somehow this might happen in Linux
            if(curr === null) return;

            //combined
            combined.count += 1;
            combined.cpu += curr.cpu;
            combined.memory += curr.memory;
            if(combined.uptime === null || combined.uptime > curr.elapsed) combined.uptime = curr.elapsed;

            //individual
            individual[pid] = {
                cpu: curr.cpu,
                memory: curr.memory,
                uptime: curr.elapsed
            }
        });
        return combined;
    } catch (error) {
        if(globals.config.verbose || true){
            logWarn('Error refreshing processes statuses', context);
            dir(error);
        }
        return false;
    }
}