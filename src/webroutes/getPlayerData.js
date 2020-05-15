//Requires
const modulename = 'WebServer:GetPlayerData';
const clone = require('clone');
const xss = require('../extras/xss')();
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);


/**
 * Returns the data for the player's modal
 * 
 * NOTE: sending license instead of id to be able to show data even for offline players
 * 
 * @param {object} ctx
 */
module.exports = async function GetPlayerData(ctx) {
    //Sanity check
    if(typeof ctx.params.license === 'undefined'){
        return ctx.utils.error(400, 'Invalid Request');
    }
    let license = ctx.params.license;

    //Locating player
    let activePlayer = clone(globals.playerController.activePlayers).find(player => player.license === license);
    dir(activePlayer)
    let playerHistory = []; //HACK

    //Preparing output
    let out = {
        funcDisabled: {
            message: (activePlayer && ctx.utils.checkPermission('commands.message', modulename, false))? '' : 'disabled',
            kick: (activePlayer && ctx.utils.checkPermission('commands.kick', modulename, false))? '' : 'disabled',
            warn: (activePlayer && ctx.utils.checkPermission('commands.warn', modulename, false))? '' : 'disabled',
            ban: !ctx.utils.checkPermission('commands.ban', modulename, false),
        }
    }

    /**
        joinDate:
        playTime:
        sessionTime:
        notesLog: Last modified by Tabarra at 06/05/2020.
        notes:
    */
    if(activePlayer){
        out.id = activePlayer.id;
        out.identifiers = activePlayer.identifiers;
        out.name = activePlayer.name;
        out.name = activePlayer.name;
        out.xxx = 'yyy';



    }else{
        let dbPlayer = globals.playerController.getPlayer(license);
        if(dbPlayer){
            //not online, in the database
            out.id = false;
            out.identifiers = [`license:${license}`];
            out.name = dbPlayer.name;
            out.aaaa = 'bbb';
        }else{
            //not online, not in the database
        }
    }

/*
    if(player){
        out = {
            name: player.name,
            identifiers: player.identifiers,
            buttons: `<!-- buttons -->
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                <button onclick="messagePlayer(${id})" type="button" class="btn btn-secondary" ${disableDM}><i class="icon-speech"></i> Send Message</button>
                <button onclick="kickPlayer(${id})" type="button" class="btn btn-danger pull-right" ${disableKick}><i class="icon-ban"></i> Kick</button>
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
*/


    return ctx.send(out);
};
