const modulename = 'WebServer:PlayersTableSearch';
import { PlayersTablePlayerType, PlayersTableSearchResp } from '@shared/playerApiTypes';
import { DatabasePlayerType } from '@modules/Database/databaseTypes';
import consoleFactory from '@lib/console';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import cleanPlayerName from '@shared/cleanPlayerName';
import { chain as createChain } from 'lodash-es';
import Fuse from 'fuse.js';
import { parseLaxIdsArrayInput } from '@lib/player/idUtils';
import { TimeCounter } from '@modules/Metrics/statsUtils';
const console = consoleFactory(modulename);

//Helpers
const DEFAULT_LIMIT = 100; //cant override it for now
const ALLOWED_SORTINGS = ['playTime', 'tsJoined', 'tsLastConnection'];
const SIMPLE_FILTERS = ['isAdmin', 'isOnline', 'isWhitelisted', 'hasNote'];
//'isBanned', 'hasPreviousBan'


/**
 * Returns the players stats for the Players page table
 */
export default async function PlayerSearch(ctx: AuthedCtx) {
    //Sanity check
    if (typeof ctx.query === 'undefined') {
        return ctx.utils.error(400, 'Invalid Request');
    }
    const {
        searchValue,
        searchType,
        filters,
        sortingKey,
        sortingDesc,
        offsetParam,
        offsetLicense
    } = ctx.query;
    const sendTypedResp = (data: PlayersTableSearchResp) => ctx.send(data);
    const searchTime = new TimeCounter();
    const adminsIdentifiers = txCore.adminStore.getAdminsIdentifiers();
    const onlinePlayersLicenses = txCore.fxPlayerlist.getOnlinePlayersLicenses();
    const dbo = txCore.database.getDboRef();
    let chain = dbo.chain.get('players').clone(); //shallow clone to avoid sorting the original
    /*
        In order:
        - [X] sort the players by the sortingKey/sortingDesc
        - [x] filter the players by the simple filters (lightweight)
        - [x] offset the players by the offsetParam/offsetLicense
        - [x] filter the players by the searchValue/searchType (VERY HEAVY!)
        - [ ] reduce actions table to get info on currently filtered players
        - [ ] filter players by isBanned & hasPreviousBan
        - [x] filter players by the limit
        - [x] process the result and (no {isBanned, warnCount, banCount} for now)
        - [x] return the result
    */


    //sort the players by the sortingKey/sortingDesc
    const parsedSortingDesc = sortingDesc === 'true';
    if (typeof sortingKey !== 'string' || !ALLOWED_SORTINGS.includes(sortingKey)) {
        return sendTypedResp({ error: 'Invalid sorting key' });
    }
    chain = chain.sort((a, b) => {
        // @ts-ignore
        return parsedSortingDesc ? b[sortingKey] - a[sortingKey] : a[sortingKey] - b[sortingKey];
    });


    //filter the players by the simple filters (lightweight)
    if (typeof filters === 'string' && filters.length) {
        const validRequestedFilters = new Set(filters.split(',').filter((x) => SIMPLE_FILTERS.includes(x)));
        if (validRequestedFilters.size) {
            const playerFilterFunctions = {
                'isAdmin': (p: DatabasePlayerType) => p.ids.some((id) => adminsIdentifiers.includes(id)),
                'isOnline': (p: DatabasePlayerType) => onlinePlayersLicenses.has(p.license),
                'isWhitelisted': (p: DatabasePlayerType) => p.tsWhitelisted,
                'hasNote': (p: DatabasePlayerType) => p.notes,
            };
            chain = chain.filter((p) => {
                for (const filterName of validRequestedFilters) {
                    if (!playerFilterFunctions[filterName as keyof typeof playerFilterFunctions](p)) {
                        return false;
                    }
                }
                return true;
            });
        }
    }


    //offset the players by the offsetParam/offsetLicense
    if (offsetParam !== undefined && offsetLicense !== undefined) {
        const parsedOffsetParam = parseInt(offsetParam as string);
        if (isNaN(parsedOffsetParam) || typeof offsetLicense !== 'string' || !offsetLicense.length) {
            return sendTypedResp({ error: 'Invalid offsetParam or offsetLicense' });
        }
        chain = chain.takeRightWhile((p) => {
            return p.license !== offsetLicense && parsedSortingDesc
                ? p[sortingKey as keyof DatabasePlayerType] as number <= parsedOffsetParam
                : p[sortingKey as keyof DatabasePlayerType] as number >= parsedOffsetParam
        });
    }


    // filter the players by the searchValue/searchType (VERY HEAVY!)
    if (typeof searchType === 'string') {
        if (typeof searchValue !== 'string' || !searchValue.length) {
            return sendTypedResp({ error: 'Invalid searchValue' });
        }

        if (searchType === 'playerName') {
            //Searching by player name
            const { pureName } = cleanPlayerName(searchValue);
            if (pureName === 'emptyname') {
                return sendTypedResp({ error: 'This player name is unsearchable (pureName is empty).' });
            }
            const players = chain.value();
            const fuse = new Fuse(players, {
                isCaseSensitive: true, //maybe that's an optimization?!
                keys: ['pureName'],
                threshold: 0.3
            });
            const filtered = fuse.search(pureName).map(x => x.item);
            chain = createChain(filtered);
        } else if (searchType === 'playerNotes') {
            //Searching by player notes
            const players = chain.value();
            const fuse = new Fuse(players, {
                keys: ['notes.text'],
                threshold: 0.3
            });
            const filtered = fuse.search(searchValue).map(x => x.item);
            chain = createChain(filtered);
        } else if (searchType === 'playerIds') {
            //Searching by player identifiers
            const { validIds, validHwids, invalids } = parseLaxIdsArrayInput(searchValue);
            if (invalids.length) {
                return sendTypedResp({ error: `Invalid identifiers (${invalids.join(',')}). Prefix any identifier with their type, like 'fivem:123456' instead of just '123456'.` });
            }
            if (!validIds.length && !validHwids.length) {
                return sendTypedResp({ error: `No valid identifiers found.` });
            }
            chain = chain.filter((p) => {
                if (validIds.length && !validIds.some((id) => p.ids.includes(id))) {
                    return false;
                }
                if (validHwids.length && !validHwids.some((hwid) => p.hwids.includes(hwid))) {
                    return false;
                }
                return true;
            });
        } else {
            return sendTypedResp({ error: 'Unknown searchType' });
        }
    }


    //filter players by the limit - taking 1 more to check if we reached the end
    chain = chain.take(DEFAULT_LIMIT + 1);
    const players = chain.value();
    const hasReachedEnd = players.length <= DEFAULT_LIMIT;
    const processedPlayers: PlayersTablePlayerType[] = players.slice(0, DEFAULT_LIMIT).map((p) => {
        return {
            license: p.license,
            displayName: p.displayName,
            playTime: p.playTime,
            tsJoined: p.tsJoined,
            tsLastConnection: p.tsLastConnection,
            notes: p.notes ? p.notes.text : undefined,

            isAdmin: p.ids.some((id) => adminsIdentifiers.includes(id)),
            isOnline: onlinePlayersLicenses.has(p.license),
            isWhitelisted: p.tsWhitelisted ? true : false,
            // isBanned: boolean,
            // warnCount: number,
            // banCount: number,
        };
    });

    txCore.metrics.txRuntime.playersTableSearchTime.count(searchTime.stop().milliseconds);
    return sendTypedResp({
        players: processedPlayers,
        hasReachedEnd,
    });
};
