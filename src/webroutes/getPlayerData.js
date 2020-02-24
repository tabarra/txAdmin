//Requires
const modulename = 'WebServer:GetPlayerData';
const xssClass = require('xss');
const clone = require('clone');
const { dir, log, logOk, logWarn, logError} = require('../extras/console')(modulename);

//Set custom xss rules
const xss = new xssClass.FilterXSS({whiteList: []});


/**
 * Returns the data for the player's modal
 * @param {object} ctx
 */
module.exports = async function GetPlayerData(ctx) {
    //Sanity check
    if(typeof ctx.params.id === 'undefined'){
        return ctx.utils.error(400, 'Invalid Request');
    }
    let id = parseInt(ctx.params.id);

    //Shortcut function
    let getPermDisable = (perm) => {
        return (ctx.utils.checkPermission(perm, modulename))? '' : 'disabled'
    }

    //Preparing output
    let out;
    let players = clone(globals.monitor.statusServer.players);
    let player = players.find(player => player.id === id);
    let disableDM = getPermDisable('commands.message');
    let disableKick = getPermDisable('commands.kick');
    if(player){
        out = {
            name: xss.process(player.name),
            identifiers: player.identifiers.map(x => xss.process(x)).join(', <br>\n'),
            buttons: `<!-- buttons -->
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                <button onclick="messagePlayer(${id})" type="button" class="btn btn-secondary" ${disableDM}><i class="icon-speech"></i> Send Message</button>
                <button onclick="kickPlayer(${id})" type="button" class="btn btn-danger" ${disableKick}><i class="icon-ban"></i> Kick</button>
            `
        }
        if(player.steam) out.buttons += `<a href="${player.steam}" target="_blank" class="btn btn-info"><i class="icon-user"></i> Steam</a>`;
    }else{
        out = {
            name: 'Unknown',
            identifiers: 'Player Disconnected',
            buttons: `<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>`
        }
    }

    return ctx.send(out);
};
