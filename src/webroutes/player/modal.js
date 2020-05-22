//Requires
const modulename = 'WebServer:PlayerModal';
const clone = require('clone');
const dateFormat = require('dateformat');
const humanizeDuration = require('humanize-duration');
const xss = require('../../extras/xss')();
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Helpers
const now = () => { return Math.round(Date.now() / 1000) };


/**
 * Returns the data for the player's modal
 * 
 * NOTE: sending license instead of id to be able to show data even for offline players
 * 
 * @param {object} ctx
 */
module.exports = async function PlayerModal(ctx) {
    //Sanity check
    if(typeof ctx.params.license === 'undefined'){
        return ctx.utils.error(400, 'Invalid Request');
    }
    let license = ctx.params.license;

    //Helper function
    const getHistory = async (idArray) => {
        try {
            let hist = await globals.playerController.getRegisteredActions(idArray);
            return hist.map((log) => {
                let out = {
                    action: log.type.toUpperCase(),
                    date: dateFormat(new Date(log.timestamp*1000), 'dd/mm'),
                    reason: log.reason,
                    author: log.author
                };
                if(log.revocation.timestamp){
                    out.color = 'dark';
                    out.action = `${out.action}-REVOKED`;
                }else if(log.type == 'ban'){
                    out.color = 'danger';
                }else if(log.type == 'warn'){
                    out.color = 'warning';
                }else if(log.type == 'whitelist'){
                    out.color = 'success';
                }else{
                    out.color = 'secondary';
                }
                return out;
            })
        } catch (error) {
            if(GlobalData.verbose){
                logError(`Error getting/processing player history`);
                dir(error);
            }
            return [];
        }
    }

    //Locating player
    let activePlayer = clone(globals.playerController.activePlayers).find(player => player.license === license);
    dir(activePlayer) //DEBUG

    //Preparing output
    let out = {
        funcDisabled: {
            message: (activePlayer && ctx.utils.checkPermission('commands.message', modulename, false))? '' : 'disabled',
            kick: (activePlayer && ctx.utils.checkPermission('commands.kick', modulename, false))? '' : 'disabled',
            warn: (activePlayer && ctx.utils.checkPermission('commands.warn', modulename, false))? '' : 'disabled',
            ban: !ctx.utils.checkPermission('commands.ban', modulename, false),
        }
    }
   
    //If player is active
    if(activePlayer){
        out.id = activePlayer.id;
        out.license = activePlayer.license;
        out.identifiers = activePlayer.identifiers;
        out.name = activePlayer.name;
        out.isTmp = activePlayer.isTmp;
        out.actionHistory = await getHistory(activePlayer.identifiers);

        let joinDateObj = new Date(activePlayer.tsJoined*1000);
        out.joinDate = dateFormat(joinDateObj, 'longDate') + ' - ' + dateFormat(joinDateObj, 'isoTime');
        
        let sessionTime = (now() - activePlayer.tsConnected)*1000;
        out.sessionTime = humanizeDuration(sessionTime, {round: true, units: ['h', 'm']});

        if(activePlayer.isTmp){
            out.playTime = '--';
            out.notesLog = 'unavailable for temporary players';
            out.notes = '';
        }else{
            let playTime = (activePlayer.playTime*60*1000);
            out.playTime = humanizeDuration(playTime, {round: true, units: ['d', 'h', 'm']});

            if(activePlayer.notes.lastAdmin && activePlayer.notes.tsLastEdit){
                let lastEditObj = new Date(activePlayer.notes.tsLastEdit*1000);
                out.notesLog = `Last modified by ${activePlayer.notes.lastAdmin} at ${dateFormat(lastEditObj, 'longDate') }`;
            }else{
                out.notesLog = '';
            }
            out.notes = activePlayer.notes.text;
        }

    //If player is offline
    }else{
        //FIXME: for actions, look just for the license
        //TODO: when we start registering all associated identifiers, we could use that for the search
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

    return ctx.send(out);
};
