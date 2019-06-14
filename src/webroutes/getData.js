//Requires
const xss = require("xss");
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'WebServer:getData';


/**
 * Getter for all the log/server/process data
 * @param {object} res
 * @param {object} req
 */
module.exports = async function action(res, req) {
    res.send({
        meta: await prepareMeta(),
        status: await prepareServerStatus(),
        players: await preparePlayers()
    })
};


//==============================================================
async function prepareServerStatus(){
    let dataServer = globals.monitor.statusServer; //shorthand much!?

    let out = '<pre>';
    let statusClass = (dataServer.online)? 'text-success bold' : 'text-danger';
    let statusText = (dataServer.online)? 'Online' : 'Offline';
    let ping = (dataServer.online && typeof dataServer.ping !== 'undefined')? dataServer.ping+'ms' : '--';
    let players = (dataServer.online && typeof dataServer.players !== 'undefined')? dataServer.players.length : '--';
    out += `<b>Status:</b> <strong class="${statusClass}">${statusText}</strong>\n`;
    out += `<b>Ping (localhost):</b> ${ping}\n`;
    out += `<b>Players:</b> ${players}\n`;
    out += `<hr>`;

    let dataHost = await globals.monitor.getHostStatus();
    let children = (typeof dataHost.children !== 'undefined' && dataHost.children)? dataHost.children : '--';
    let cpu = (typeof dataHost.cpu !== 'undefined' && dataHost.cpu)? dataHost.cpu+'%' : '--';
    let memory = (typeof dataHost.memory !== 'undefined' && dataHost.memory)? dataHost.memory+'%' : '--';

    let hitches;
    if(typeof dataHost.hitches === 'undefined' || typeof dataHost.hitches !== 'number'){
        hitches = '--';
    }else if(dataHost.hitches > 10000){
        let secs = (dataHost.hitches/1000).toFixed();
        let pct = ((secs/60)*100).toFixed();
        hitches = `${secs}s/min (${pct}%)`;
    }else{
        hitches = dataHost.hitches+'ms/min';
    }

    out += `<b>Child Processes:</b> ${children}\n`;
    out += `<b>Hitches:</b> ${hitches}\n`;
    out += `<b>Host CPU:</b> ${cpu}\n`;
    out += `<b>Host Memory:</b> ${memory}\n`;

    return out;
}


//==============================================================
function preparePlayers(){
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


//==============================================================
async function prepareMeta(){
    let dataServer = globals.monitor.statusServer; //shorthand much!?
    return {
        favicon: (dataServer.online)? 'favicon_on' : 'favicon_off',
        title: (dataServer.online)? `(${dataServer.players.length}) FXAdmin` : 'FXAdmin'
    };
}
