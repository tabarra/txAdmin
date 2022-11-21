const modulename = 'WebServer:PlayerListSearch';
import Fuse from "fuse.js";
import consts from '@core/extras/consts';
import logger from '@core/extras/console.js';
import { verbose } from '@core/globalData';
import cleanPlayerName from '@core/../shared/cleanPlayerName';
import { cloneDeep } from 'lodash-es';
import { processActionList, processPlayerList } from './processor';
const { dir, log, logOk, logWarn, logError } = logger(modulename);


/**
 * Handles the search functionality.
 * NOTE: expected types:
 *        *- identifier (solo/csv)
 *        *- action id
 *        *- partial name
 *         - license
 *         - active id
 *
 * @param {object} ctx
 */
export default async function PlayerListSearch(ctx) {
    //Prepare dbo
    const dbo = globals.playerDatabase.getDb();

    //Sanity check & var setup
    if (typeof ctx.request.query.query !== 'string') {
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }
    const searchString = ctx.request.query.query.trim();
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
};



