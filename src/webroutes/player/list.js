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
 * @param {object} ctx
 * @param {object} dbo
 * @returns {object} page render promise
 */
async function handleSearch(ctx, dbo){
    //Sanity check
    if(typeof ctx.request.query.search !== 'string'){
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }
    const searchString = ctx.request.query.search.trim();

    dir(searchString)
    //TODO: process the type of info on the query
    //TODO: perform queries
    //TODO: process results
    //TODO: return object

    try {
        // const lastPlayers = await dbo.get("players")
        //                     .takeRight(5)
        //                     .reverse()
        //                     .cloneDeep()
        //                     .value();
        // return await processPlayerList(lastPlayers);
        // const resPlayers = await processPlayerList(lastPlayers);

        // const lastActions = await dbo.get("actions")
        //                     .takeRight(5)
        //                     .reverse()
        //                     .cloneDeep()
        //                     .value();
        // return await processActionList(lastActions);
        // const resActions = await processActionList(lastActions);

        // TODO: 
        // processPlayerList()
        // processActionList()
        const resPlayers = [
            {
              name: "Sharif222",
              license: "da4e5c173b3ba97e7f201de0fcd44443db7d4844",
              joined: "13/06/2020 03:52:35",
              class: "dark"
            },
            {
              name: "TwopleSir",
              license: "da4e6b2215101b9db56403c3ac7c9b02ce39df72",
              joined: "13/06/2020 03:52:35",
              class: "dark"
            },
            {
              name: "roger gendron",
              license: "e38a1d8d76197ef1d786282e18f2751fe96c7a96",
              joined: "13/06/2020 03:52:24",
              class: "dark"
            }
        ]
        
        const resActions = [
            {
              id: "AD8A-TF29",
              action: "WARN",
              date: "14/06/2020 02:20:16",
              reason: "asdasd",
              author: "tabarra",
              revocationNotice: false,
              color: "warning",
              message: "tabarra WARNED Tabarra"
            },
            {
              id: "WYN8-NMPH",
              action: "WHITELIST",
              date: "14/06/2020 02:19:23",
              reason: "",
              author: "tabarra",
              revocationNotice: false,
              color: "success",
              message: "tabarra WHITELISTED Tabarra"
            },
            {
              id: "B89M-LDZ8",
              action: "BAN",
              date: "13/06/2020 22:37:27",
              reason: "ban dude ban",
              author: "tabarra",
              revocationNotice: false,
              color: "danger",
              message: "tabarra BANNED tuhvvrnt",
              footerNote: "Expires at 15/06/2020 22:37:27."
            }
          ]

        return ctx.send({resPlayers, resActions});
    } catch (error) {
        if(GlobalData.verbose) logError(`handleSearch failed with error: ${error.message}`);
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
            revoke: !ctx.utils.checkPermission('players.ban', modulename, false),
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
        
        return {
            players: playerStats.players.toLocaleString(),
            playTime: playTime,
            whitelists: actionStats.whitelists.toLocaleString(),
            bans: actionStats.bans.toLocaleString(),
            warns: actionStats.warns.toLocaleString()
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
    let tsNow = now();
    return list.map((log) => {
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
    const activeLicenses = globals.playerController.activePlayers.map(p => p.license);
    return list.map(p => {
        return {
            name: p.name,
            license: p.license,
            joined: (new Date(p.tsJoined*1000)).toLocaleString(),
            class: (activeLicenses.includes(p.license))? 'success' : 'dark'
        }   
    })
}
