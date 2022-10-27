const modulename = 'WebServer:WhitelistActions';
import logger from '@core/extras/console.js';
import { Context } from 'koa';
import { GenericApiResp } from '@shared/genericApiTypes';
import PlayerDatabase from '@core/components/PlayerDatabase';
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
    } else if (table === 'yyyyyy') {
        return sendTypedResp(await handleXXXXX(ctx, action));
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

        try {
            playerDatabase.registerWhitelistApprovals({
                identifier,
                playerName,
                playerAvatar,
                tsApproved: now(),
                approvedBy: ctx.session.auth.username,
            });
            return { success: true };
        } catch (error) {
            return { error: `Failed to save wl approval: ${(error as Error).message}` };
        }

    } else if (action === 'remove') {
        try {
            playerDatabase.removeWhitelistApprovals({ identifier: idlowerCased });
            return { success: true };
        } catch (error) {
            return { error: `Failed to remove wl approval: ${(error as Error).message}` };
        }

    } else {
        return { error: 'unknown action' };
    }
}
