//Requires
const modulename = 'WebServer:PlayerList';
const dateFormat = require('dateformat');
const humanizeDuration = require('humanize-duration');
const xss = require('../../extras/xss')();
const { dir, log, logOk, logWarn, logError, getLog } = require('../../extras/console')(modulename);

//Helpers
const now = () => { return Math.round(Date.now() / 1000) };

//HACK search button doesn't actually work :facepalm:
/**
 * Returns the output page containing the action log, and the console log
 * 
 * TODO: Return last players
 * FIXME: Add Caching ASAP. This is a _very_ expensive method.
 * 
 * @param {object} ctx
 */
module.exports = async function PlayerList(ctx) {
    //Prepare dbo
    const dbo = globals.playerController.getDB();

    //Delegate to the specific action handler
    if(ctx.request.query && ctx.request.query.search){
        return await handleSearch(ctx, dbo);
    }else{
        return await handleDefault(ctx, dbo);
    }
};


//================================================================
/**
 * Handles the search functionality.
 * 
 * NOTE: This might be cool to add: https://fusejs.io/
 * 
 * NOTE: expected types:
 *        *- identifier (solo/csv)
 *        *- action id
 *        *- partial name
 *         - license
 *         - active id
 * 
 * @param {object} ctx
 * @param {object} dbo
 * @returns {object} page render promise
 */
async function handleSearch(ctx, dbo){
    //Sanity check & var setup
    if(typeof ctx.request.query.search !== 'string'){
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }
    const searchString = ctx.request.query.search.trim();
    let outData = {
        message: '',
        resPlayers: [],
        resActions: []
    };
    const addPlural = (x) => { return (x == 0 || x > 1)? 's' : ''; };

    try {
        //Getting valid identifiers
        const joinedValidIDKeys = Object.keys(GlobalData.validIdentifiers).join('|');
        const idsRegex = new RegExp(`((${joinedValidIDKeys}):\\w+)`, 'g');
        const idsArray = [...searchString.matchAll(idsRegex)]
            .map(x => x[0])
            .filter((e, i, arr) => {
                return arr.indexOf(e) == i;
            });

        //IF searching for identifiers
        if(idsArray.length){
            const actions = await dbo.get("actions")
                .filter(a => idsArray.some((fi) => a.identifiers.includes(fi)))
                .take(512)
                .cloneDeep()
                .value();
            outData.resActions = await processActionList(actions);

            //NOTE: disabled due to the unexpected behavior of it finding players that do not have any of the identifiers being searched for
            let licensesArr = [];
            actions.forEach(a => {
                a.identifiers.forEach(id => {
                    if(id.substring(0, 8) == "license:"){
                        licensesArr.push(id.substring(8));
                    }
                })
            })
            //TODO: adapt this for when we start saving all IDs for the players
            // const licensesArr = idsArray.filter(id => id.substring(0, 8) == "license:").map(id => id.substring(8));
            const players = await dbo.get("players")
                .filter(p => licensesArr.includes(p.license))
                .take(512)
                .cloneDeep()
                .value();
            outData.resPlayers = await processPlayerList(players);
            outData.message = `Searching by identifiers found ${players.length} player${addPlural(players.length)} and ${actions.length} action${addPlural(actions.length)}.`;
            

        //IF searching for an acition ID
        }else if(GlobalData.regexActionID.test(searchString.toUpperCase())){
            const action = await dbo.get("actions")
                .find({id: searchString.toUpperCase()})
                .cloneDeep()
                .value();
            if(!action){
                outData.message = `Searching by Action ID found no results.`;

            }else{
                outData.resActions = await processActionList([action]);
    
                //TODO: adapt this for when we start saving all IDs for the players
                const licensesArr = action.identifiers.filter(x => x.substring(0, 8) == "license:").map(x => x.substring(8));
                if(licensesArr.length){
                    const players = await dbo.get("players")
                        .filter(p => licensesArr.includes(p.license))
                        .take(512)
                        .cloneDeep()
                        .value();
                    outData.resPlayers = await processPlayerList(players);
                }
                outData.message = `Searching by Action ID found ${outData.resPlayers.length} related player${addPlural(outData.resPlayers.length)}.`;
            }


        //Likely searching for an partial name
        }else{
            const players = await dbo.get("players")
                .filter(p => {
                    return p.name && p.name.toLowerCase().includes(searchString.toLowerCase())
                })
                .take(512)
                .cloneDeep()
                .value();
            outData.resPlayers = await processPlayerList(players);
            //TODO: if player found, search for all actions from them
            outData.message = `Searching by name found ${players.length} player${addPlural(players.length)}.`;
            
        }


        //Give output
        return ctx.send(outData);
    } catch (error) {
        if(GlobalData.verbose){
            logError(`handleSearch failed with error: ${error.message}`);
            dir(error)
        }
        return ctx.send({error: `Search failed with error: ${error.message}`})
    }
}


//================================================================
/**
 * Handles the default page rendering (index).
 * @param {object} ctx
 * @param {object} dbo
 * @returns {object} page render promise
 */
async function handleDefault(ctx, dbo){
    let timeStart = new Date();
    const controllerConfigs = globals.playerController.config;
    const queryLimits = {
        whitelist: 15,
        actions: 20,
        players: 30,
    }
    const respData = {
        stats: await getStats(dbo),
        queryLimits,
        lastWhitelistBlocks: await getPendingWL(dbo, queryLimits.whitelist),
        lastActions: await getLastActions(dbo, queryLimits.actions),
        lastPlayers: await getLastPlayers(dbo, queryLimits.players),
        disableBans: !controllerConfigs.onJoinCheckBan,
        disableWhitelist: !controllerConfigs.onJoinCheckWhitelist,
        permsDisable: {
            whitelist: !ctx.utils.checkPermission('players.whitelist', modulename, false),
            ban: !ctx.utils.checkPermission('players.ban', modulename, false),
        }
    };

    //Output
    const timeElapsed = new Date() - timeStart;
    respData.message = `Executed in ${timeElapsed} ms`;
    return ctx.utils.render('playerList', respData);
}


//================================================================
/**
 * Get the last entries of the pending whitelist table, sorted by timestamp.
 * @param {object} dbo
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
                                }else if(a.type == 'whitelist'){
                                    acc.whitelists++;
                                }
                                return acc;
                            }, {bans:0, warns:0, whitelists:0})
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
        
        //Stats only:
        //DEBUG reevaluate this in the future
        globals.databus.playerDBStats = {
            ts: now(),
            players: playerStats.players,
            playTime: playerStats.playTime,
            bans: actionStats.bans,
            warns: actionStats.warns,
            whitelists: actionStats.whitelists,
        }

        return {
            players: playerStats.players.toLocaleString(),
            playTime: playTime,
            bans: actionStats.bans.toLocaleString(),
            warns: actionStats.warns.toLocaleString(),
            whitelists: actionStats.whitelists.toLocaleString(),
        }
    } catch (error) {
        const msg = `getStats failed with error: ${error.message}`;
        if(GlobalData.verbose) logError(msg);
        return []
    }
}


//================================================================
/**
 * Get the last entries of the pending whitelist table, sorted by timestamp.
 * @param {object} dbo
 * @param {number} limit
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


//================================================================
/**
 * Get the last actions from the end of the list.
 * NOTE: this is not being sorted by timestamp, we are assuming its ordered.
 * @param {object} dbo
 * @param {number} limit
 * @returns {array} array of processed actions, or [] on error
 */
async function getLastActions(dbo, limit){
    try {
        const lastActions = await dbo.get("actions")
                            .takeRight(limit)
                            .reverse()
                            .cloneDeep()
                            .value();
        return await processActionList(lastActions)
    } catch (error) {
        const msg = `getLastActions failed with error: ${error.message}`;
        if(GlobalData.verbose) logError(msg);
        return []
    }
}


//================================================================
/**
 * Get the last actions from the end of the list.
 * NOTE: this is not being sorted by timestamp, we are assuming its ordered.
 * @param {object} dbo
 * @param {number} limit
 * @returns {array} array of processed actions, or [] on error
 */
async function getLastPlayers(dbo, limit){
    try {
        const lastPlayers = await dbo.get("players")
                            .takeRight(limit)
                            .reverse()
                            .cloneDeep()
                            .value();
        return await processPlayerList(lastPlayers);

    } catch (error) {
        const msg = `getLastPlayers failed with error: ${error.message}`;
        if(GlobalData.verbose) logError(msg);
        return []
    }
}


//================================================================
/**
 * Processes an action list and returns a templatization array.
 * @param {array} list
 * @returns {array} array of actions, or throws on error
 */
async function processActionList(list){
    if(!list) return [];

    let tsNow = now();
    return list.map((log) => {
        let out = {
            id: log.id,
            type: log.type,
            date: (new Date(log.timestamp*1000)).toLocaleString(),
            reason: log.reason,
            author: log.author,
            revocationNotice: false,
            color: null,
            message: null,
            isRevoked: null,
            footerNote: null,
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
            out.isRevoked = true;
            const revocationDate = (new Date(log.revocation.timestamp*1000)).toLocaleString();
            out.footerNote = `Revoked by ${log.revocation.author} on ${revocationDate}.`;
        }
        if(typeof log.expiration == 'number'){
            const expirationDate = (new Date(log.expiration*1000)).toLocaleString();
            out.footerNote = (log.expiration < tsNow)? `Expired at ${expirationDate}.` : `Expires at ${expirationDate}.`;
        }
        return out;
    })
}


//================================================================
/**
 * Processes an player list and returns a templatization array.
 * @param {array} list
 * @returns {array} array of players, or throws on error
 */
async function processPlayerList(list){
    if(!list) return [];

    const activeLicenses = globals.playerController.activePlayers.map(p => p.license);
    return list.map(p => {
        return {
            name: p.name,
            license: p.license,
            joined: (new Date(p.tsJoined*1000)).toLocaleString(),
            color: (activeLicenses.includes(p.license))? 'success' : 'dark'
        }   
    })
}
