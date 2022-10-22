const modulename = 'WebServer:WhitelistList';
import { DatabaseObjectType } from '@core/components/PlayerDatabase/database';
import { DatabaseWhitelistApprovalsType, DatabaseWhitelistRequestsType } from '@core/components/PlayerDatabase/databaseTypes';
import logger from '@core/extras/console.js';
import { Context } from 'koa';
const { dir, log, logOk, logWarn, logError } = logger(modulename);


/**
 * Returns the output page containing the action log, and the console log
 */
export default async function WhitelistList(ctx: Context) {
    //Prepare dbo
    const dbo = globals.playerDatabase.getDb();
    const store = ctx.params.store;

    //Delegate to the specific handler
    if(store === 'requests'){
        return await handleRequests(ctx, dbo);
    }else if(store === 'approvals'){
        return await handleApprovals(ctx, dbo);
    }else{
        return ctx.send({ error: 'unknown store' });
    }
};


/**
 * Handles the search functionality.
 */
 async function handleRequests(ctx: Context, dbo: DatabaseObjectType) {
    const sendTypedResp = (data: DatabaseWhitelistRequestsType[]) => ctx.send(data);

    sendTypedResp([
        {
            id: 'R1234',
            license: 'license:c98fb45345090a74f089e2675d601695c083b94a',
            playerName: 'Tabarra',
            discordTag: 'tabarra#1234',
            discordAvatar: 'https://forum.cfx.re/user_avatar/forum.cfx.re/tabarra/256/198232_2.png',
            tsLastAttempt: 1666445526,
        },
        {
            id: 'R5678',
            license: '00000000000000000000000000000000deadbeef',
            playerName: 'fulano',
            tsLastAttempt: 1666446573,
        },
    ]);

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
async function handleApprovals(ctx: Context, dbo: DatabaseObjectType) {
    const sendTypedResp = (data: DatabaseWhitelistApprovalsType[]) => ctx.send(data);

    sendTypedResp([
        {
            identifier: 'discord:272800190639898628',
            playerName: 'tabarra#1234',
            playerAvatar: 'https://forum.cfx.re/user_avatar/forum.cfx.re/tabarra/256/198232_2.png',
            tsApproved: 1666445526,
            approvedBy: 'adminmaster'
        },
        {
            identifier: 'license:c98fb45345090a74f089e2675d601695c00f0f0f',
            playerName: 'c98fb4...0f0f0f',
            playerAvatar: null,
            tsApproved: 1666446573,
            approvedBy: 'adminmaster'
        },
        {
            identifier: 'license:00000000000000000000000000000000deadbeef',
            playerName: 'fulano',
            playerAvatar: null,
            tsApproved: 1666446880,
            approvedBy: 'adminmaster'
        },
    ]);

    
}
