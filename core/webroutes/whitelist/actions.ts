const modulename = 'WebServer:WhitelistActions';
import logger, { ogConsole } from '@core/extras/console.js';
import { Context } from 'koa';
import { GenericApiResp } from '@shared/genericApiTypes';
import PlayerDatabase, { DuplicateKeyError } from '@core/components/PlayerDatabase';
import { now, parsePlayerId } from '@core/extras/helpers';
import DiscordBot from '@core/components/DiscordBot';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

//Helper functions
const anyUndefined = (...args: any) => { return [...args].some((x) => (typeof x === 'undefined')); };



/**
 * Returns the output page containing the bans experiment
 */
export default async function WhitelistActions(ctx: Context) {
    //Sanity check
    if (anyUndefined(ctx.params.action)) {
        return ctx.utils.error(400, 'Invalid Request');
    }
    const { table, action } = ctx.params;
    const sendTypedResp = (data: GenericApiResp) => ctx.send(data);

    //Delegate to the specific table handler
    if (table === 'approvals') {
        return sendTypedResp(await handleApprovals(ctx, action));
    } else if (table === 'requests') {
        return sendTypedResp(await handleRequests(ctx, action));
    } else {
        return sendTypedResp({ error: 'unknown table' });
    }
};


/**
 * Handle actions regarding the whitelist approvals table
 */
async function handleApprovals(ctx: Context, action: any): Promise<GenericApiResp> {
    //Typescript stuff
    const playerDatabase = (globals.playerDatabase as PlayerDatabase);
    const discordBot = (globals.discordBot as DiscordBot);

    //Input validation
    if (typeof ctx.request.body?.identifier !== 'string') {
        return { error: 'identifier not specified' };
    }
    const identifier = ctx.request.body.identifier;
    const { isIdValid, idType, idValue, idlowerCased } = parsePlayerId(identifier);
    if (!isIdValid || !idType || !idValue || !idlowerCased) {
        return { error: 'Error: the provided identifier does not seem to be valid' };
    }

    if (action === 'add') {
        //Preparing player name/avatar
        let playerAvatar = null;
        let playerName = (idValue.length > 8)
            ? `${idType}...${idValue.slice(-8)}`
            : `${idType}:${idValue}`;
        if (idType === 'discord') {
            try {
                const { tag, avatar } = await discordBot.resolveMember(idValue);
                playerName = tag;
                playerAvatar = avatar;
            } catch (error) { }
        }

        //Registering approval
        try {
            playerDatabase.registerWhitelistApprovals({
                identifier,
                playerName,
                playerAvatar,
                tsApproved: now(),
                approvedBy: ctx.session.auth.username,
            });
        } catch (error) {
            return { error: `Failed to save wl approval: ${(error as Error).message}` };
        }
        return { success: true };

    } else if (action === 'remove') {
        try {
            playerDatabase.removeWhitelistApprovals({ identifier: idlowerCased });
        } catch (error) {
            return { error: `Failed to remove wl approval: ${(error as Error).message}` };
        }
        return { success: true };

    } else {
        return { error: 'unknown action' };
    }
}


/**
 * Handle actions regarding the whitelist requests table
 */
async function handleRequests(ctx: Context, action: any): Promise<GenericApiResp> {
    //Typescript stuff
    const playerDatabase = (globals.playerDatabase as PlayerDatabase);

    //Input validation
    const reqId = ctx.request.body?.reqId;
    if (typeof reqId !== 'string' || !reqId.length) {
        return { error: 'reqId not specified' };
    }

    if (action === 'approve') {
        //Find request
        const requests = playerDatabase.getWhitelistRequests({ id: reqId });
        if (!requests.length) {
            return { error: `Whitelist request ID ${reqId} not found.` };
        }
        const req = requests[0]; //just getting the first

        //Register whitelistApprovals
        try {
            playerDatabase.registerWhitelistApprovals({
                identifier: `license:${req.license}`,
                playerName: req.discordTag ?? req.playerDisplayName,
                playerAvatar: (req.discordAvatar) ? req.discordAvatar : null,
                tsApproved: now(),
                approvedBy: ctx.session.auth.username,
            });
        } catch (error) {
            if(!(error instanceof DuplicateKeyError)){
                return { error: `Failed to save wl approval: ${(error as Error).message}` };
            }
        }

        //Remove record from whitelistRequests
        try {
            playerDatabase.removeWhitelistRequests({ id: reqId });
        } catch (error) {
            return { error: `Failed to remove wl request: ${(error as Error).message}` };
        }
        return { success: true };

    } else if (action === 'deny') {
        try {
            playerDatabase.removeWhitelistRequests({ id: reqId });
        } catch (error) {
            return { error: `Failed to remove wl request: ${(error as Error).message}` };
        }
        return { success: true };

    } else {
        return { error: 'unknown action' };
    }
}
