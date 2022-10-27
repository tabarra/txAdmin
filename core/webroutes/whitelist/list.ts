const modulename = 'WebServer:WhitelistList';
import PlayerDatabase from '@core/components/PlayerDatabase';
import { DatabaseWhitelistApprovalsType, DatabaseWhitelistRequestsType } from '@core/components/PlayerDatabase/databaseTypes';
import logger from '@core/extras/console.js';
import { Context } from 'koa';
const { dir, log, logOk, logWarn, logError } = logger(modulename);


/**
 * Returns the output page containing the action log, and the console log
 */
export default async function WhitelistList(ctx: Context) {
    const playerDatabase = (globals.playerDatabase as PlayerDatabase);
    const store = ctx.params.store;

    //Delegate to the specific handler
    if(store === 'requests'){
        return await handleRequests(ctx, playerDatabase);
    }else if(store === 'approvals'){
        return await handleApprovals(ctx, playerDatabase);
    }else{
        return ctx.send({ error: 'unknown store' });
    }
};


/**
 * Handles the search functionality.
 */
 async function handleRequests(ctx: Context, playerDatabase: PlayerDatabase) {
    const sendTypedResp = (data: DatabaseWhitelistRequestsType[]) => ctx.send(data);

    const requests = playerDatabase.getWhitelistRequests().reverse();
    return sendTypedResp(requests);

    //TODO: implement search and pagination
    // if (ctx.request.query?.search) {
    //     return await handleSearch(ctx, dbo);
    // } else {
    //     const respData = {
    //         headerTitle: 'Whitelist',
    //     };
    //     return ctx.utils.render('main/whitelist', respData);
    // }
}


/**
 * Handles the search functionality.
 */
async function handleApprovals(ctx: Context, playerDatabase: PlayerDatabase) {
    const sendTypedResp = (data: DatabaseWhitelistApprovalsType[]) => ctx.send(data);

    const approvals = playerDatabase.getWhitelistApprovals().reverse();
    return sendTypedResp(approvals);
}
