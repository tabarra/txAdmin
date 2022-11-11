const modulename = 'WebServer:PlayerList';
import Fuse from "fuse.js";
import humanizeDuration from 'humanize-duration';
import xssInstancer from '@core/extras/xss.js';
import consts from '@core/extras/consts';
import logger from '@core/extras/console.js';
import { verbose } from '@core/globalData';
import cleanPlayerName from '@core/../shared/cleanPlayerName';
import { cloneDeep } from 'lodash-es';
const { dir, log, logOk, logWarn, logError } = logger(modulename);
const xss = xssInstancer();

//Helpers
const now = () => { return Math.round(Date.now() / 1000); };


/**
 * Returns the output page containing the action log, and the console log
 *
 * TODO: Return last players
 * FIXME: Add Caching ASAP. This is a _very_ expensive method.
 *
 * @param {object} ctx
 */
export default async function PlayerList(ctx) {
    //Prepare dbo
    const dbo = globals.playerDatabase.getDb();

    //Delegate to the specific action handler
    if (ctx.request.query?.search) {
        return await handleSearch(ctx, dbo);
    } else {
        return await handleDefault(ctx, dbo);
    }
};


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
async function handleSearch(ctx, dbo) {
    //Sanity check & var setup
    if (typeof ctx.request.query.search !== 'string') {
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }
    const searchString = ctx.request.query.search.trim();
    let outData = {
        message: '',
        resPlayers: [],
        resActions: [],
    };
    const addPlural = (x) => { return (x == 0 || x > 1) ? 's' : ''; };

    try {
        //Getting valid identifiers
        const joinedValidIDKeys = Object.keys(consts.validIdentifiers).join('|');
        const idsRegex = new RegExp(`((${joinedValidIDKeys}):\\w+)`, 'g');
        const idsArray = [...searchString.matchAll(idsRegex)]
            .map((x) => x[0])
            .filter((e, i, arr) => {
                return arr.indexOf(e) == i;
            });

        //IF searching for identifiers
        if (idsArray.length) {
            const actions = await dbo.chain.get('actions')
                .filter((a) => idsArray.some((fi) => a.identifiers.includes(fi)))
                .take(512)
                .cloneDeep()
                .value();
            outData.resActions = await processActionList(actions);

            const players = await dbo.chain.get('players')
                .filter((p) => idsArray.some((fi) => p.ids.includes(fi)))
                .take(512)
                .cloneDeep()
                .value();
            outData.resPlayers = await processPlayerList(players);
            outData.message = `Searching by identifiers found ${players.length} player${addPlural(players.length)} and ${actions.length} action${addPlural(actions.length)}.`;

        //IF searching for an action ID
        } else if (consts.regexActionID.test(searchString.toUpperCase())) {
            const action = await dbo.chain.get('actions')
                .find({id: searchString.toUpperCase()})
                .cloneDeep()
                .value();
            if (!action) {
                outData.message = 'Searching by Action ID found no results.';
            } else {
                outData.resActions = await processActionList([action]);

                const players = await dbo.chain.get('players')
                    .filter((p) => action.identifiers.some((fi) => p.ids.includes(fi)))
                    .take(512)
                    .cloneDeep()
                    .value();
                outData.resPlayers = await processPlayerList(players);
                outData.message = `Searching by Action ID found ${outData.resPlayers.length} related player${addPlural(outData.resPlayers.length)}.`;
            }

        //Likely searching for a partial name
        } else {
            const { pureName } = cleanPlayerName(searchString);
            const players = dbo.chain.get('players').value();
            const fuse = new Fuse(players, {
                keys: ['pureName'],
                threshold: 0.3
            });
            const filtered = cloneDeep(fuse.search(pureName, {limit: 128}).map(x => x.item));

            outData.resPlayers = await processPlayerList(filtered);
            //TODO: if player found, search for all actions from them
            outData.message = `Searching by name found ${filtered.length} player${addPlural(filtered.length)}.`;
        }

        //Give output
        return ctx.send(outData);
    } catch (error) {
        if (verbose) {
            logError(`handleSearch failed with error: ${error.message}`);
            dir(error);
        }
        return ctx.send({error: `Search failed with error: ${error.message}`});
    }
}


/**
 * Handles the default page rendering (index).
 * @param {object} ctx
 * @param {object} dbo
 * @returns {object} page render promise
 */
async function handleDefault(ctx, dbo) {
    let timeStart = new Date();
    const controllerConfigs = globals.playerDatabase.config;
    const queryLimits = {
        actions: 20,
        players: 30,
    };
    const respData = {
        headerTitle: 'Players',
        stats: await getStats(dbo),
        queryLimits,
        lastActions: await getLastActions(dbo, queryLimits.actions),
        lastPlayers: await getLastPlayers(dbo, queryLimits.players),
        disableBans: !controllerConfigs.onJoinCheckBan,
        permsDisable: {
            ban: !ctx.utils.hasPermission('players.ban'),
            warn: !ctx.utils.hasPermission('players.warn'),
        },
    };

    //Output
    const timeElapsed = new Date() - timeStart;
    respData.message = `Executed in ${timeElapsed} ms`;
    return ctx.utils.render('main/playerList', respData);
}


/**
 * Get stats on actions and players
 * @param {object} dbo
 * @returns {object} array of actions
 */
async function getStats(dbo) {
    try {
        const actionStats = await dbo.chain.get('actions')
            .reduce((acc, a, ind) => {
                if (a.type == 'ban') {
                    acc.bans++;
                } else if (a.type == 'warn') {
                    acc.warns++;
                }
                return acc;
            }, {bans:0, warns:0})
            .value();

        const playerStats = await dbo.chain.get('players')
            .reduce((acc, p, ind) => {
                acc.players++;
                acc.playTime += p.playTime;
                if(p.tsWhitelisted) acc.whitelists++;
                return acc;
            }, {players:0, playTime:0, whitelists:0})
            .value();
        const playTimeSeconds = playerStats.playTime * 60 * 1000;
        let humanizeOptions = {
            round: true,
            units: ['y', 'd', 'h'],
            largest: 2,
            spacer: '',
            language: 'shortEn',
            languages: {
                shortEn: {
                    y: () => 'y',
                    d: () => 'd',
                    h: () => 'h',
                },
            },
        };
        const playTime = humanizeDuration(playTimeSeconds, humanizeOptions);

        //Stats only:
        //DEBUG reevaluate this in the future
        globals.databus.txStatsData.playerDBStats = {
            ts: now(),
            players: playerStats.players,
            playTime: playerStats.playTime,
            bans: actionStats.bans,
            warns: actionStats.warns,
            whitelists: playerStats.whitelists,
        };

        return {
            players: playerStats.players.toLocaleString(),
            playTime: playTime,
            bans: actionStats.bans.toLocaleString(),
            warns: actionStats.warns.toLocaleString(),
            whitelists: playerStats.whitelists.toLocaleString(),
        };
    } catch (error) {
        const msg = `getStats failed with error: ${error.message}`;
        if (verbose) logError(msg);
        return [];
    }
}


/**
 * Get the last actions from the end of the list.
 * NOTE: this is not being sorted by timestamp, we are assuming its ordered.
 * @param {object} dbo
 * @param {number} limit
 * @returns {array} array of processed actions, or [] on error
 */
async function getLastActions(dbo, limit) {
    try {
        const lastActions = await dbo.chain.get('actions')
            .takeRight(limit)
            .reverse()
            .cloneDeep()
            .value();
        return await processActionList(lastActions);
    } catch (error) {
        const msg = `getLastActions failed with error: ${error.message}`;
        if (verbose) logError(msg);
        return [];
    }
}


/**
 * Get the last actions from the end of the list.
 * NOTE: this is not being sorted by timestamp, we are assuming its ordered.
 * @param {object} dbo
 * @param {number} limit
 * @returns {array} array of processed actions, or [] on error
 */
async function getLastPlayers(dbo, limit) {
    try {
        const lastPlayers = await dbo.chain.get('players')
            .takeRight(limit)
            .reverse()
            .cloneDeep()
            .value();
        return await processPlayerList(lastPlayers);
    } catch (error) {
        const msg = `getLastPlayers failed with error: ${error.message}`;
        if (verbose) logError(msg);
        return [];
    }
}


/**
 * Processes an action list and returns a templatization array.
 * @param {array} list
 * @returns {array} array of actions, or throws on error
 */
async function processActionList(list) {
    if (!list) return [];

    let tsNow = now();
    return list.map((log) => {
        let out = {
            id: log.id,
            type: log.type,
            date: (new Date(log.timestamp * 1000)).toLocaleString(),
            reason: log.reason,
            author: log.author,
            revocationNotice: false,
            color: null,
            message: null,
            isRevoked: null,
            footerNote: null,
        };
        let actReference;
        if (log.playerName) {
            actReference = xss(log.playerName);
        } else {
            actReference = '<i>' + xss(log.identifiers.map((x) => x.split(':')[0]).join(', ')) + '</i>';
        }
        if (log.type == 'ban') {
            out.color = 'danger';
            out.message = `${xss(log.author)} BANNED ${actReference}`;
        } else if (log.type == 'warn') {
            out.color = 'warning';
            out.message = `${xss(log.author)} WARNED ${actReference}`;
        } else {
            out.color = 'secondary';
            out.message = `${xss(log.author)} ${log.type.toUpperCase()} ${actReference}`;
        }
        if (log.revocation.timestamp) {
            out.color = 'dark';
            out.isRevoked = true;
            const revocationDate = (new Date(log.revocation.timestamp * 1000)).toLocaleString();
            out.footerNote = `Revoked by ${log.revocation.author} on ${revocationDate}.`;
        }
        if (typeof log.expiration == 'number') {
            const expirationDate = (new Date(log.expiration * 1000)).toLocaleString();
            out.footerNote = (log.expiration < tsNow) ? `Expired at ${expirationDate}.` : `Expires at ${expirationDate}.`;
        }
        return out;
    });
}


/**
 * Processes an player list and returns a templatization array.
 * @param {array} list
 * @returns {array} array of players, or throws on error
 */
async function processPlayerList(list) {
    if (!list) return [];

    const activeLicenses = globals.playerlistManager.getPlayerList()
        .map((p) => p.license)
        .filter(l => l);
    return list.map((p) => {
        return {
            name: p.displayName,
            license: p.license,
            joined: (new Date(p.tsJoined * 1000)).toLocaleString(),
            color: (activeLicenses.includes(p.license)) ? 'success' : 'dark',
        };
    });
}
