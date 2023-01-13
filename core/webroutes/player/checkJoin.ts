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
import AdminVault from '@core/components/AdminVault';
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
    if (!playerDatabase.config.onJoinCheckBan && playerDatabase.config.whitelistMode === 'disabled') {
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

        //Checking whitelist
        if (playerDatabase.config.whitelistMode === 'adminOnly') {
            const result = await checkAdminOnlyMode(validIdsArray, validIdsObject, playerName);
            if (!result.allow) return sendTypedResp(result);

        } else if (playerDatabase.config.whitelistMode === 'approvedLicense') {
            const result = await checkApprovedLicense(validIdsArray, validIdsObject, playerName);
            if (!result.allow) return sendTypedResp(result);

        } else if (playerDatabase.config.whitelistMode === 'guildMember') {
            const result = await checkGuildMember(validIdsArray, validIdsObject, playerName);
            if (!result.allow) return sendTypedResp(result);

        } else if (playerDatabase.config.whitelistMode === 'guildRoles') {
            const result = await checkGuildRoles(validIdsArray, validIdsObject, playerName);
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
 * Checks if the player is an admin
 */
async function checkAdminOnlyMode(
    validIdsArray: string[],
    validIdsObject: PlayerIdsObjectType,
    playerName: string
): Promise<AllowRespType | DenyRespType> {
    const playerDatabase = (globals.playerDatabase as PlayerDatabase);
    const adminVault = (globals.adminVault as AdminVault);

    //Check if fivem/discord ids are available
    if (!validIdsObject.license && !validIdsObject.discord) {
        return {
            allow: false,
            reason: rejectMessageTemplate(
                'This server is in <strong>Admin-only</strong> mode.',
                'You do not have <code>discord</code> or <code>fivem</code> identifiers, which is required to validade if you are a txAdmin administrator.'
            ),
        }
    }

    //Looking for admin
    const admin = adminVault.getAdminByIdentifiers(validIdsArray);
    if (admin) return { allow: true };

    //Prepare rejection message
    let customMessage = '';
    if (playerDatabase.config.whitelistRejectionMessage) {
        customMessage = `<br>${playerDatabase.config.whitelistRejectionMessage.trim()}`;
    }
    const reason = rejectMessageTemplate(
        'This server is in <strong>Admin-only</strong> mode.',
        `Your identifiers are not assigned to any txAdmin administrator. <br>
        ${customMessage}`
    );
    return { allow: false, reason };
}


/**
 * Checks if the player is a discord guild member
 */
async function checkGuildMember(
    validIdsArray: string[],
    validIdsObject: PlayerIdsObjectType,
    playerName: string
): Promise<AllowRespType | DenyRespType> {
    const playerDatabase = (globals.playerDatabase as PlayerDatabase);
    const discordBot = (globals.discordBot as DiscordBot);

    //Check if discord id is available
    if (!validIdsObject.discord) {
        return {
            allow: false,
            reason: rejectMessageTemplate(
                'This server is in <strong>Discord Guild Member Whitelist</strong> mode.',
                'You do not have the <code>discord</code> identifier, which is required to validade if you have joined our Discord Guild. Please open Discord and try again.'
            ),
        }
    }

    //Resolving member
    let errorTitle, errorMessage;
    try {
        const { isMember, memberRoles } = await discordBot.resolveMemberRoles(validIdsObject.discord);
        if (isMember) {
            return { allow: true };
        } else {
            errorTitle = `Discord Guild Member Whitelist is required to join this server.`;
            errorMessage = `Please join the guild <strong>${discordBot.guildName}</strong> then try again.`;
        }
    } catch (error) {
        errorTitle = `Error validating Discord Guild Member Whitelist:`;
        errorMessage = `<code>${(error as Error).message}</code>`;
    }

    //Prepare rejection message
    let customMessage = '';
    if (playerDatabase.config.whitelistRejectionMessage) {
        customMessage = `<br>${playerDatabase.config.whitelistRejectionMessage.trim()}`;
    }
    const reason = rejectMessageTemplate(
        errorTitle,
        `${errorMessage} <br>
        ${customMessage}`
    );
    return { allow: false, reason };
}


/**
 * Checks if the player has specific discord guild roles
 */
async function checkGuildRoles(
    validIdsArray: string[],
    validIdsObject: PlayerIdsObjectType,
    playerName: string
): Promise<AllowRespType | DenyRespType> {
    const playerDatabase = (globals.playerDatabase as PlayerDatabase);
    const discordBot = (globals.discordBot as DiscordBot);

    //Check if discord id is available
    if (!validIdsObject.discord) {
        return {
            allow: false,
            reason: rejectMessageTemplate(
                'This server is in <strong>Discord Role Whitelist</strong> mode.',
                'You do not have the <code>discord</code> identifier, which is required to validade if you have joined our Discord Guild. Please open Discord and try again.'
            ),
        }
    }

    //Resolving member
    let errorTitle, errorMessage;
    try {
        const { isMember, memberRoles } = await discordBot.resolveMemberRoles(validIdsObject.discord);
        if (isMember) {
            const matchingRole = playerDatabase.config.whitelistedDiscordRoles
                .find((requiredRole) => memberRoles?.includes(requiredRole));
            if (matchingRole) {
                return { allow: true };
            } else {
                errorTitle = `You do not have a whitelisted role required to join.`;
                errorMessage = `Please join the guild <strong>${discordBot.guildName}</strong>, get one of the required roles, then try again.`;
            }
        } else {
            errorTitle = `Discord Role Whitelist is required to join this server.`;
            errorMessage = `To join this server you are required to have at least one of the whitelisted roles on the guild <strong>${discordBot.guildName}</strong>.`;
        }
    } catch (error) {
        errorTitle = `Error validating Discord Role Whitelist:`;
        errorMessage = `<code>${(error as Error).message}</code>`;
    }

    //Prepare rejection message
    let customMessage = '';
    if (playerDatabase.config.whitelistRejectionMessage) {
        customMessage = `<br>${playerDatabase.config.whitelistRejectionMessage.trim()}`;
    }
    const reason = rejectMessageTemplate(
        errorTitle,
        `${errorMessage} <br>
        ${customMessage}`
    );
    return { allow: false, reason };
}


/**
 * Checks if the player has a whitelisted license
 */
async function checkApprovedLicense(
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
    if (validIdsObject.discord && discordBot.isClientReady) {
        try {
            const { tag, avatar } = await discordBot.resolveMemberProfile(validIdsObject.discord);
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
