const modulename = 'WebServer:WhitelistList';
import Fuse from "fuse.js";
import PlayerDatabase from '@core/components/PlayerDatabase';
import { DatabaseWhitelistApprovalsType, DatabaseWhitelistRequestsType } from '@core/components/PlayerDatabase/databaseTypes';
import logger, { ogConsole } from '@core/extras/console.js';
import { Context } from 'koa';
import cleanPlayerName from "@shared/cleanPlayerName";
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
        total: number;
        newest: number; //for the ignore all button not remove any that hasn't been seeing by the admin
        requests: DatabaseWhitelistRequestsType[];
    }
    const sendTypedResp = (data: resp) => ctx.send(data);

    const requests = playerDatabase.getWhitelistRequests().reverse();

    let filtered;
    const searchString = ctx.request.query?.searchString;
    if (typeof searchString === 'string') {
        const fuse = new Fuse(requests, {
            keys: ['id', 'playerPureName', 'discordTag'],
            threshold: 0.3
        });
        const { pureName } = cleanPlayerName(searchString);
        filtered = fuse.search(pureName).map(x => x.item);
    }

    const toDisplay = filtered ?? requests;
    return sendTypedResp({
        total: requests.length,
        newest: (requests.length) ? requests[0].tsLastAttempt : 0,
        requests: toDisplay,
    });

    //fazer só com newer e older?
    //TODO: implement search and pagination

}


/**
 * Handles the search functionality.
 */
async function handleApprovals(ctx: Context, playerDatabase: PlayerDatabase) {
    const sendTypedResp = (data: DatabaseWhitelistApprovalsType[]) => ctx.send(data);

    const approvals = playerDatabase.getWhitelistApprovals().reverse();
    return sendTypedResp(approvals);
}
