//Requires
const modulename = 'WebServer:PlayerList';
const dateFormat = require('dateformat');
const humanizeDuration = require('humanize-duration');
const xss = require('../../extras/xss')();
const { dir, log, logOk, logWarn, logError, getLog } = require('../../extras/console')(modulename);


/**
 * Returns the output page containing the action log, and the console log
 * 
 * TODO: Return last players
 * FIXME: Add Caching ASAP. This is a _very_ expensive method.
 * 
 * @param {object} ctx
 */
module.exports = async function PlayerList(ctx) {
    

    let timeStart = new Date();
    const dbo = globals.playerController.getDB();
    const controllerConfigs = globals.playerController.config;
    let respData = {
        stats: await getStats(dbo),
        lastWhitelistBlocks: await getPendingWL(dbo, 15),
        actionHistory: await getActionHistory(dbo),
        lastJoinedPlayers: [],
        disableBans: !controllerConfigs.onJoinCheckBan,
        disableWhitelist: !controllerConfigs.onJoinCheckWhitelist,
        permsDisable: {
            whitelist: !ctx.utils.checkPermission('players.whitelist', modulename, false),
            revoke: !ctx.utils.checkPermission('players.ban', modulename, false),
            ban: !ctx.utils.checkPermission('players.ban', modulename, false),
        }
    };

    //Output
    let timeElapsed = new Date() - timeStart;
    respData.message = `Executed in ${timeElapsed} ms`;
    return ctx.utils.render('playerList', respData);
};


/**
 * Get the last entries of the pending whitelist table, sorted by timestamp.
 * @returns {object} array of actions, or, throws on error
 */
async function getStats(dbo){
    try {

        const actionStats = await dbo.get("actions")
                            .reduce((acc, a, ind)=>{
                                if(a.type == 'ban'){
                                    acc.bans++;
                                }else if(a.type == 'warn'){
                                    acc.warns++;
                                }
                                return acc;
                            }, {bans:0, warns:0})
                            .value();

        const playerStats = await dbo.get("players")
                            .reduce((acc, p, ind)=>{
                                acc.players++;
                                acc.playTime += p.playTime;
                                return acc;
                            }, {players:0, playTime:0})
                            .value();
        const playTimeSeconds = playerStats.playTime * 60 * 1000;
        let humanizeOptions = {
            round: true,
            units: ['d', 'h'],
            largest: 2,
            spacer: '',
            language: 'shortEn',
            languages: {
                shortEn: {
                    d: () => 'd',
                    h: () => 'h'
                }
            }
        }
        const playTime = humanizeDuration(playTimeSeconds, humanizeOptions);
        
        return {
            players: playerStats.players.toLocaleString(),
            playTime: playTime,
            bans: actionStats.bans.toLocaleString(),
            warns: actionStats.warns.toLocaleString()
        }
    } catch (error) {
        const msg = `getStats failed with error: ${error.message}`;
        if(GlobalData.verbose) logError(msg);
        return []
    }
}


/**
 * Get the last entries of the pending whitelist table, sorted by timestamp.
 * @returns {array} array of actions, or [] on error
 */
async function getPendingWL(dbo, limit){
    try {
        let pendingWL = await dbo.get("pendingWL")
                            .sortBy('tsLastAttempt')
                            .take(limit)
                            .cloneDeep()
                            .value();

        //DEBUG: remove this
        // pendingWL = []
        // for (let i = 0; i < 15; i++) {
        //     pendingWL.push({
        //         id: "RNV000",
        //         name: `lorem ipsum ${i}`,
        //         license: "9b9fc300cc6aaaaad3b5df4dcccce4933753",
        //         tsLastAttempt: 1590282667
        //     });
        // }

        const maxNameSize = 36;
        let lastWhitelistBlocks = pendingWL.map((x) => {
            x.time = dateFormat(new Date(x.tsLastAttempt*1000), 'isoTime');
            if(x.name.length > maxNameSize){
                x.name = x.name.substring(0,maxNameSize-3) + '...';
            }
            return x;
        })

        return lastWhitelistBlocks;
    } catch (error) {
        const msg = `getPendingWL failed with error: ${error.message}`;
        if(GlobalData.verbose) logError(msg);
        return []
    }
}


/**
 * Get the entire action history.
 * @returns {array} array of actions, or [] on error
 */
async function getActionHistory(dbo){
    try {
        let hist = await dbo.get("actions").cloneDeep().reverse().value();
        return hist.map((log) => {
            let out = {
                id: log.id,
                action: log.type.toUpperCase(),
                date: (new Date(log.timestamp*1000)).toLocaleString(),
                reason: log.reason,
                author: log.author,
                revocationNotice: false
            };
            let actReference;
            if(log.playerName){
                actReference = xss(log.playerName);
            }else{
                actReference = '<i>' + xss(log.identifiers.map((x) => x.split(':')[0]).join(', ')) + '</i>';
            }
            if(log.type == 'ban'){
                out.color = 'danger';
                out.message = `${xss(log.author)} BANNED ${actReference}`;

            }else if(log.type == 'warn'){
                out.color = 'warning';
                out.message = `${xss(log.author)} WARNED ${actReference}`;
                
            }else if(log.type == 'whitelist'){
                out.color = 'success';
                out.message = `${xss(log.author)} WHITELISTED ${actReference}`;
                out.reason = '';

            }else{
                out.color = 'secondary';
                out.message = `${xss(log.author)} ${log.type.toUpperCase()} ${actReference}`;

            }
            if(log.revocation.timestamp){
                out.color = 'dark';
                const revocationDate = (new Date(log.revocation.timestamp*1000)).toLocaleString();
                out.revocationNotice = `Revoked by ${log.revocation.author} on ${revocationDate}.`;
            }
            return out;
        })
    } catch (error) {
        const msg = `getActionHistory failed with error: ${error.message}`;
        if(GlobalData.verbose) logError(msg);
        return []
    }
}
