//Requires
const xss = require("xss");
const prettyBytes = require('pretty-bytes');
const prettyMs = require('pretty-ms');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'WebServer:getData';


/**
 * Getter for all the log/server/process data
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    res.send({
        status: await sendServerStatus(),
        players: await sendPlayers(),
        log: await sendLog()
    })
};


//==============================================================
function sendServerStatus(){
    let dataServer = globals.monitor.statusServer; //shorthand much!?
    let dataProcess = globals.monitor.statusProcess; //shorthand much!?

    let out = '<pre>';
    let statusClass = (dataServer.online)? 'text-success bold' : 'text-danger';
    let statusText = (dataServer.online)? 'Online' : 'Offline';
    let ping = (dataServer.online && typeof dataServer.ping !== 'undefined')? dataServer.ping+'ms' : '--';
    let players = (dataServer.online && typeof dataServer.players !== 'undefined')? dataServer.players.length : '--';
    out += `<b>Status:</b> <strong class="${statusClass}">${statusText}</strong>\n`;
    out += `<b>Ping (localhost):</b> ${ping}\n`;
    out += `<b>Players:</b> ${players}\n`;
    out += `<hr>`;

    let cpu = (dataProcess && typeof dataProcess.cpu !== 'undefined')? dataProcess.cpu+'%' : '--' ;
    let memory = (dataProcess && typeof dataProcess.memory !== 'undefined')? prettyBytes(dataProcess.memory) : '--' ;
    let uptime = (dataProcess && typeof dataProcess.uptime !== 'undefined')? prettyMs(dataProcess.uptime) : '--' ;
    let ctime = (dataProcess && typeof dataProcess.ctime !== 'undefined')? dataProcess.ctime+'ms' : '--' ;
    out += `<b>CPU:</b> ${cpu}\n`;
    out += `<b>Memory:</b> ${memory}\n`;
    out += `<b>Uptime:</b> ${uptime}\n`;
    out += `<b>CTime:</b> ${ctime}`;
    out += '</pre>';
    return out;
}


//==============================================================
function sendPlayers(){
    let dataServer = globals.monitor.statusServer; //shorthand much!?
    let out = '<pre>';

    if(!dataServer.players.length) return '<pre>No players Online</pre>';

    out += `<b>Ping\tNick</b>\n`;
    dataServer.players.forEach(player => {
        out += ` ${player.ping}\t`;
        if(player.steam){
            out += `<a href="${player.steam}" target="_blank">${xss(player.name)}</a>\n`;
        }else{
            out += `${player.name}\n`;
        }
    });
    out += '</pre>';
    return out;
}

async function sendLog(){
    let log = await globals.logger.get();
    return `<pre>${xss(log)}</pre>`;
}