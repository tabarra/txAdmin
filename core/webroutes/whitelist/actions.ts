const modulename = 'WebServer:WhitelistActions';
import logger, { ogConsole } from '@core/extras/console.js';
import { Context } from 'koa';
import { GenericApiResp } from '@shared/genericApiTypes';
import PlayerDatabase, { DuplicateKeyError } from '@core/components/PlayerDatabase';
import { now, parsePlayerId } from '@core/extras/helpers';
import DiscordBot from '@core/components/DiscordBot';
import { DatabaseWhitelistRequestsType } from '@core/components/PlayerDatabase/databaseTypes';
import FXRunner from '@core/components/FxRunner';
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

    //Check permissions
    if (!ctx.utils.testPermission('players.whitelist')) {
        return sendTypedResp({ error: 'You don\'t have permission to execute this action.' });
    }

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
    const fxRunner = (globals.fxRunner as FXRunner);

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
                const { tag, avatar } = await discordBot.resolveMemberProfile(idValue);
                playerName = tag;
                playerAvatar = avatar;
            } catch (error) { }
        }

        //Registering approval
        try {
            playerDatabase.registerWhitelistApprovals({
                identifier: idlowerCased,
                playerName,
                playerAvatar,
                tsApproved: now(),
                approvedBy: ctx.session.auth.username,
            });
            fxRunner.sendEvent('whitelistPreApproval', {
                action: 'added',
                identifier: idlowerCased,
                playerName,
                adminName: ctx.session.auth.username,
            });
        } catch (error) {
            return { error: `Failed to save wl approval: ${(error as Error).message}` };
        }
        ctx.utils.logAction(`Added whitelist approval for ${playerName}.`);
        return { success: true };

    } else if (action === 'remove') {
        try {
            playerDatabase.removeWhitelistApprovals({ identifier: idlowerCased });
            fxRunner.sendEvent('whitelistPreApproval', {
                action: 'removed',
                identifier: idlowerCased,
                adminName: ctx.session.auth.username,
            });
        } catch (error) {
            return { error: `Failed to remove wl approval: ${(error as Error).message}` };
        }
        ctx.utils.logAction(`Removed whitelist approval from ${idlowerCased}.`);
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
    const fxRunner = (globals.fxRunner as FXRunner);

    //Checkinf for the deny all action, the others need reqId
    if (action === 'deny_all') {
        const cutoff = parseInt(ctx.request.body?.newestVisible);
        if (isNaN(cutoff)) {
            return { error: 'newestVisible not specified' };
        }

        try {
            const filter = (req: DatabaseWhitelistRequestsType) => req.tsLastAttempt <= cutoff;
            playerDatabase.removeWhitelistRequests(filter);
            fxRunner.sendEvent('whitelistRequest', {
                action: 'deniedAll',
                adminName: ctx.session.auth.username,
            });
        } catch (error) {
            return { error: `Failed to remove all wl request: ${(error as Error).message}` };
        }
        ctx.utils.logAction('Denied all whitelist requests.');
        return { success: true };
    }

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
        const playerName = req.discordTag ?? req.playerDisplayName;
        const identifier = `license:${req.license}`;
        try {
            playerDatabase.registerWhitelistApprovals({
                identifier,
                playerName,
                playerAvatar: (req.discordAvatar) ? req.discordAvatar : null,
                tsApproved: now(),
                approvedBy: ctx.session.auth.username,
            });
            fxRunner.sendEvent('whitelistRequest', {
                action: 'approved',
                playerName,
                requestId: req.id,
                license: req.license,
                adminName: ctx.session.auth.username,
            });
        } catch (error) {
            if (!(error instanceof DuplicateKeyError)) {
                return { error: `Failed to save wl approval: ${(error as Error).message}` };
            }
        }
        ctx.utils.logAction(`Approved whitelist request from ${playerName}.`);

        //Remove record from whitelistRequests
        try {
            playerDatabase.removeWhitelistRequests({ id: reqId });
        } catch (error) {
            return { error: `Failed to remove wl request: ${(error as Error).message}` };
        }
        return { success: true };

    } else if (action === 'deny') {
        try {
            const requests = playerDatabase.removeWhitelistRequests({ id: reqId });
            if(requests.length){
                const req = requests[0]; //just getting the first
                fxRunner.sendEvent('whitelistRequest', {
                    action: 'denied',
                    playerName: req.playerDisplayName,
                    requestId: req.id,
                    license: req.license,
                    adminName: ctx.session.auth.username,
                });
            }
        } catch (error) {
            return { error: `Failed to remove wl request: ${(error as Error).message}` };
        }
        ctx.utils.logAction(`Denied whitelist request ${reqId}.`);
        return { success: true };

    } else {
        return { error: 'unknown action' };
    }
}
