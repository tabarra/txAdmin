const modulename = 'WebServer:PlayerCheckJoin';
import cleanPlayerName from '@shared/cleanPlayerName';
import { GenericApiError } from '@shared/genericApiTypes';
import PlayerDatabase from '@core/components/PlayerDatabase';
import { DatabaseActionType, DatabaseWhitelistApprovalsType } from '@core/components/PlayerDatabase/databaseTypes';
import Translator from '@core/components/Translator';
import logger, { ogConsole } from '@core/extras/console.js';
import { anyUndefined, now, parsePlayerIds, PlayerIdsObjectType } from '@core/extras/helpers';
import xssInstancer from '@core/extras/xss';
import { verbose } from '@core/globalData';
import playerResolver from '@core/playerLogic/playerResolver';
import humanizeDuration, { Unit } from 'humanize-duration';
import { Context } from 'koa';
import DiscordBot from '@core/components/DiscordBot';
const { dir, log, logOk, logWarn, logError } = logger(modulename);
const xss = xssInstancer();

//Helper
const rejectMessageTemplate = (title: string, content: string) => {
    return `
    <div style="
        background-color: rgba(30, 30, 30, 0.5);
        padding: 20px;
        border: solid 2px var(--color-modal-border);
        border-radius: var(--border-radius-normal);
        margin-top: 25px;
        position: relative;
    ">
        <h2>${title}</h2>
        <br>
        <p style="font-size: 1.25rem; padding: 0px">
            ${content}
        </p>
        <img src="https://i.imgur.com/5bFhvBv.png" style="
            position: absolute;
            right: 15px;
            bottom: 15px;
            opacity: 65%;
        ">
    </div>`.replaceAll(/[\r\n]/g, '');
}

//Resp Type
type AllowRespType = {
    allow: true;
}
type DenyRespType = {
    allow: false;
    reason: string;
}
type PlayerCheckJoinApiRespType = AllowRespType | DenyRespType | GenericApiError;


/**
 * Intercommunications endpoint
 * @param {object} ctx
 */
export default async function PlayerCheckJoin(ctx: Context) {
    //Typescript stuff
    const playerDatabase = (globals.playerDatabase as PlayerDatabase);
    const sendTypedResp = (data: PlayerCheckJoinApiRespType) => ctx.send(data);

    //If checking not required at all
    if (!playerDatabase.config.onJoinCheckBan && !playerDatabase.config.onJoinCheckWhitelist) {
        return sendTypedResp({ allow: true });
    }

    //Checking request
    if (anyUndefined(
        ctx.request.body,
        ctx.request.body.playerName,
        ctx.request.body.playerIds,
    )) {
        return sendTypedResp({ error: 'Invalid request.' });
    }
    const { playerName, playerIds } = ctx.request.body;

    //DEBUG: save join log
    const toLog = {
        ts: Date.now(),
        playerName,
        playerIds,
    };
    globals.databus.joinCheckHistory.push(toLog);
    if (globals.databus.joinCheckHistory.length > 25) globals.databus.joinCheckHistory.shift();

    //Validating body data
    if (typeof playerName !== 'string') return sendTypedResp({ error: 'playerName should be an string.' });
    if (!Array.isArray(playerIds)) return sendTypedResp({ error: 'Identifiers should be an array.' });
    const { validIdsArray, validIdsObject } = parsePlayerIds(playerIds);
    if (validIdsArray.length < 1) return sendTypedResp({ error: 'Identifiers array must contain at least 1 valid identifier.' });


    try {
        // If ban checking enabled
        if (playerDatabase.config.onJoinCheckBan) {
            const result = checkBan(validIdsArray);
            if (!result.allow) return sendTypedResp(result);
        }

        // If discord whitelist enabled
        //TODO: add here discord whitelisting, don't interact with the code below

        // If admin-only mode enabled (#516)
        //TODO: easy to do, just need to figure out the UI

        // If whitelist checking enabled
        if (playerDatabase.config.onJoinCheckWhitelist) {
            const result = await checkWhitelist(validIdsArray, validIdsObject, playerName);
            if (!result.allow) return sendTypedResp(result);
        }

        //If not blocked by ban/wl, allow join
        // return sendTypedResp({ allow: false, reason: 'APPROVED, BUT TEMP BLOCKED (DEBUG)' });
        return sendTypedResp({ allow: true });
    } catch (error) {
        const msg = `Failed to check ban/whitelist status: ${(error as Error).message}`;
        logError(msg);
        if (verbose) dir(error);
        return sendTypedResp({ error: msg });
    }
};


/**
 * Checks if the player is banned
 */
function checkBan(validIdsArray: string[]): AllowRespType | DenyRespType {
    const playerDatabase = (globals.playerDatabase as PlayerDatabase);
    const translator = (globals.translator as Translator);

    // Check active bans on matching identifiers
    const ts = now();
    const filter = (action: DatabaseActionType) => {
        return (
            action.type === 'ban'
            && (!action.expiration || action.expiration > ts)
            && (!action.revocation.timestamp)
        );
    };
    const activeBans = playerDatabase.getRegisteredActions(validIdsArray, filter);
    if (activeBans.length) {
        const ban = activeBans[0];

        const textKeys = {
            title_permanent: translator.t('ban_messages.reject.title_permanent'),
            title_temporary: translator.t('ban_messages.reject.title_temporary'),
            label_expiration: translator.t('ban_messages.reject.label_expiration'),
            label_date: translator.t('ban_messages.reject.label_date'),
            label_author: translator.t('ban_messages.reject.label_author'),
            label_reason: translator.t('ban_messages.reject.label_reason'),
            label_id: translator.t('ban_messages.reject.label_id'),
            note_multiple_bans: translator.t('ban_messages.reject.note_multiple_bans'),
        };
        const language = translator.t('$meta.humanizer_language');

        let title;
        let expLine = '';
        if (ban.expiration) {
            const humanizeOptions = {
                language,
                round: true,
                units: ['d', 'h'] as Unit[],
            };
            const duration = humanizeDuration((ban.expiration - ts) * 1000, humanizeOptions);
            expLine = `<strong>${textKeys.label_expiration}:</strong> ${duration} <br>`;
            title = textKeys.title_temporary;
        } else {
            title = textKeys.title_permanent;
        }
        const banDate = new Date(ban.timestamp * 1000).toLocaleString(
            translator.canonical,
            { dateStyle: 'medium', timeStyle: 'medium' }
        )
        const note = (activeBans.length > 1) ? `<br>${textKeys.note_multiple_bans}` : '';

        let customMessage = '';
        if (playerDatabase.config.banRejectionMessage) {
            customMessage = `<br>${playerDatabase.config.banRejectionMessage.trim()}`;
        }

        const reason = rejectMessageTemplate(
            title,
            `${expLine}
            <strong>${textKeys.label_date}:</strong> ${banDate} <br>
            <strong>${textKeys.label_author}:</strong> ${xss(ban.author)} <br>
            <strong>${textKeys.label_reason}:</strong> ${xss(ban.reason)} <br>
            <strong>${textKeys.label_id}:</strong> <code style="letter-spacing: 2px; background-color: #ff7f5059; padding: 2px 4px; border-radius: 6px;">${ban.id}</code> <br>
            ${customMessage}
            <span style="font-style: italic;">${note}</span>`
        );

        return { allow: false, reason };
    } else {
        return { allow: true };
    }
}


/**
 * Checks if the player is whitelisted
 */
async function checkWhitelist(
    validIdsArray: string[],
    validIdsObject: PlayerIdsObjectType,
    playerName: string
): Promise<AllowRespType | DenyRespType> {
    const playerDatabase = (globals.playerDatabase as PlayerDatabase);
    const discordBot = (globals.discordBot as DiscordBot);

    //Check if license is available
    if (!validIdsObject.license) {
        return {
            allow: false,
            reason: rejectMessageTemplate(
                'This server has whitelist enabled and requires all players to have the license identifier.',
                'If you are the server owner, remove <code>sv_lan</code> from your server config file.'
            ),
        }
    }

    //Finding the player and checking if already whitelisted
    let player;
    try {
        player = playerResolver(null, null, validIdsObject.license);
        const dbData = player.getDbData();
        if (dbData && dbData.tsWhitelisted) {
            return { allow: true };
        }
    } catch (error) { }

    //Common vars
    const { displayName, pureName } = cleanPlayerName(playerName);
    const ts = now();

    //Searching for the license/discord on whitelistApprovals
    const allIdsFilter = (x: DatabaseWhitelistApprovalsType) => {
        return validIdsArray.includes(x.identifier);
    }
    const approvals = playerDatabase.getWhitelistApprovals(allIdsFilter);
    if (approvals.length) {
        //update or register player
        if (typeof player !== 'undefined' && player.license) {
            player.setWhitelist(true);
        } else {
            playerDatabase.registerPlayer({
                license: validIdsObject.license,
                ids: validIdsArray,
                displayName,
                pureName,
                playTime: 0,
                tsLastConnection: ts,
                tsJoined: ts,
                tsWhitelisted: ts,
            });
        }

        //Remove entries from whitelistApprovals & whitelistRequests
        playerDatabase.removeWhitelistApprovals(allIdsFilter);
        playerDatabase.removeWhitelistRequests({ license: validIdsObject.license });

        //return allow join
        return { allow: true };
    }


    //Player is not whitelisted
    //Resolve player discord
    let discordTag, discordAvatar;
    if (validIdsObject.discord && discordBot.client) {
        try {
            const { tag, avatar } = await discordBot.resolveMember(validIdsObject.discord);
            discordTag = tag;
            discordAvatar = avatar;
        } catch (error) { }
    }

    //Check if this player has an active wl request
    //NOTE: it could return multiple, but we are not dealing with it
    let wlRequestId: string;
    const requests = playerDatabase.getWhitelistRequests({ license: validIdsObject.license });
    if (requests.length) {
        wlRequestId = requests[0].id; //just getting the first
        playerDatabase.updateWhitelistRequests(validIdsObject.license, {
            playerDisplayName: displayName,
            playerPureName: pureName,
            discordTag,
            discordAvatar,
            tsLastAttempt: ts,
        });
    } else {
        wlRequestId = playerDatabase.registerWhitelistRequests({
            license: validIdsObject.license,
            playerDisplayName: displayName,
            playerPureName: pureName,
            discordTag,
            discordAvatar,
            tsLastAttempt: ts,
        });
    }

    //Prepare rejection message
    let customMessage = '';
    if (playerDatabase.config.whitelistRejectionMessage) {
        customMessage = `<br>${playerDatabase.config.whitelistRejectionMessage.trim()}`;
    }

    const label_req_id = `Request ID`;
    const reason = rejectMessageTemplate(
        'You are not whitelisted to join this server.',
        `<strong>${label_req_id}:</strong>
        <code style="letter-spacing: 2px; background-color: #ff7f5059; padding: 2px 4px; border-radius: 6px;">${wlRequestId}</code> <br>
        ${customMessage}`
    );
    return { allow: false, reason }
}
