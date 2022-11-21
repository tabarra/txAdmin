const modulename = 'WebServer:WhitelistList';
import Fuse from "fuse.js";
import PlayerDatabase from '@core/components/PlayerDatabase';
import { DatabaseWhitelistApprovalsType, DatabaseWhitelistRequestsType } from '@core/components/PlayerDatabase/databaseTypes';
import logger, { ogConsole } from '@core/extras/console.js';
import { Context } from 'koa';
import cleanPlayerName from "@shared/cleanPlayerName";
import { GenericApiError } from "@core/../shared/genericApiTypes";
const { dir, log, logOk, logWarn, logError } = logger(modulename);


/**
 * Returns the output page containing the action log, and the console log
 */
export default async function WhitelistList(ctx: Context) {
    const playerDatabase = (globals.playerDatabase as PlayerDatabase);
    const table = ctx.params.table;

    //Delegate to the specific handler
    if (table === 'requests') {
        return await handleRequests(ctx, playerDatabase);
    } else if (table === 'approvals') {
        return await handleApprovals(ctx, playerDatabase);
    } else {
        return ctx.send({ error: 'unknown table' });
    }
};


/**
 * Handles the search functionality.
 */
async function handleRequests(ctx: Context, playerDatabase: PlayerDatabase) {
    type resp = {
        cntTotal: number;
        cntFiltered: number;
        newest: number; //for the ignore all button not remove any that hasn't been seeing by the admin
        totalPages: number;
        currPage: number;
        requests: DatabaseWhitelistRequestsType[];
    } | GenericApiError
    const sendTypedResp = (data: resp) => ctx.send(data);

    const requests = playerDatabase.getWhitelistRequests().reverse();

    //Filter by player name, discord tag and req id
    let filtered = requests;
    const searchString = ctx.request.query?.searchString;
    if (typeof searchString === 'string' && searchString.length) {
        const fuse = new Fuse(requests, {
            keys: ['id', 'playerPureName', 'discordTag'],
            threshold: 0.3
        });
        const { pureName } = cleanPlayerName(searchString);
        filtered = fuse.search(pureName).map(x => x.item);
    }

    //Pagination
    //NOTE: i think we can totally just send the whole list to the front end do pagination
    const pageSize = 15;
    const pageinput = ctx.request.query?.page;
    let currPage = 1;
    if (typeof pageinput === 'string') {
        if (/^\d+$/.test(pageinput)) {
            currPage = parseInt(pageinput);
            if (currPage < 1) {
                return sendTypedResp({error: 'page should be >= 1'});
            }
        } else {
            return sendTypedResp({error: 'page should be a number'});
        }
    }
    const skip = (currPage - 1) * pageSize;
    const paginated = filtered.slice(skip, skip+pageSize);
    
    return sendTypedResp({
        cntTotal: requests.length,
        cntFiltered: filtered.length,
        newest: (requests.length) ? requests[0].tsLastAttempt : 0,
        totalPages: Math.ceil(filtered.length/pageSize),
        currPage,
        requests: paginated,
    });
}


/**
 * Handles the search functionality.
 */
async function handleApprovals(ctx: Context, playerDatabase: PlayerDatabase) {
    const sendTypedResp = (data: DatabaseWhitelistApprovalsType[]) => ctx.send(data);

    const approvals = playerDatabase.getWhitelistApprovals().reverse();
    return sendTypedResp(approvals);
}
