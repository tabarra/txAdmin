const modulename = 'WebServer:PlayerCheckJoin';
import cleanPlayerName from '@shared/cleanPlayerName';
import { GenericApiErrorResp } from '@shared/genericApiTypes';
import { DatabaseActionType, DatabaseWhitelistApprovalsType } from '@core/components/PlayerDatabase/databaseTypes';
import { anyUndefined, filterPlayerHwids, now, parsePlayerIds } from '@core/extras/helpers';
import type { PlayerIdsObjectType } from "@shared/otherTypes";
import xssInstancer from '@core/extras/xss';
import playerResolver from '@core/playerLogic/playerResolver';
import humanizeDuration, { Unit } from 'humanize-duration';
import consoleFactory from '@extras/console';
import { TimeCounter } from '@core/components/StatsManager/statsUtils';
import { InitializedCtx } from '@core/components/WebServer/ctxTypes';
import TxAdmin from '@core/txAdmin';
const console = consoleFactory(modulename);
const xss = xssInstancer();

//Helper
const htmlCodeTag = '<code style="background-color: hsl(202deg 40% 66% / 35%); padding: 2px 2px; border-radius: 4px;">';
const htmlCodeIdTag = '<code style="letter-spacing: 2px; background-color: #ff7f5059; padding: 2px 4px; border-radius: 6px;">';
const htmlGuildNameTag = '<strong style="color: cornflowerblue">';
const rejectMessageTemplate = (title: string, content: string) => {
    content = content.replaceAll('<code>', htmlCodeTag);
    content = content.replaceAll('<codeid>', htmlCodeIdTag).replaceAll('</codeid>', '</code>');
    content = content.replaceAll('<guildname>', htmlGuildNameTag).replaceAll('</guildname>', '</strong>');
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
        <img src="https://forum-cfx-re.akamaized.net/original/5X/c/3/8/e/c38e8346a39c6483385c0727bee5c2abc705156a.png" style="
            position: absolute;
            right: 15px;
            bottom: 15px;
            opacity: 25%;
        ">
    </div>`.replaceAll(/[\r\n]/g, '');
}

const prepCustomMessage = (msg: string) => {
    if(!msg) return '';
    return '<br>' + msg.trim().replaceAll(/\n/g, '<br>');
}

//Resp Type
type AllowRespType = {
    allow: true;
}
type DenyRespType = {
    allow: false;
    reason: string;
}
type PlayerCheckJoinApiRespType = AllowRespType | DenyRespType | GenericApiErrorResp;


/**
 * Endpoint for checking a player join, which checks whitelist and bans.
 */
export default async function PlayerCheckJoin(ctx: InitializedCtx) {
    const sendTypedResp = (data: PlayerCheckJoinApiRespType) => ctx.send(data);

    //If checking not required at all
    if (
        !ctx.txAdmin.playerDatabase.config.onJoinCheckBan
        && ctx.txAdmin.playerDatabase.config.whitelistMode === 'disabled'
    ) {
        return sendTypedResp({ allow: true });
    }

    //Checking request
    if (anyUndefined(
        ctx.request.body,
        ctx.request.body.playerName,
        ctx.request.body.playerIds,
        ctx.request.body.playerHwids,
    )) {
        return sendTypedResp({ error: 'Invalid request.' });
    }
    const { playerName, playerIds, playerHwids } = ctx.request.body;

    //Validating body data
    if (typeof playerName !== 'string') return sendTypedResp({ error: 'playerName should be an string.' });
    if (!Array.isArray(playerIds)) return sendTypedResp({ error: 'playerIds should be an array.' });
    const { validIdsArray, validIdsObject } = parsePlayerIds(playerIds);
    if (validIdsArray.length < 1) return sendTypedResp({ error: 'Identifiers array must contain at least 1 valid identifier.' });
    if (!Array.isArray(playerHwids)) return sendTypedResp({ error: 'playerHwids should be an array.' });
    const { validHwidsArray } = filterPlayerHwids(playerHwids);


    try {
        // If ban checking enabled
        if (ctx.txAdmin.playerDatabase.config.onJoinCheckBan) {
            const checkTime = new TimeCounter();
            const result = checkBan(ctx.txAdmin, validIdsArray, validIdsObject, validHwidsArray);
            ctx.txAdmin.statsManager.txRuntime.banCheckTime.count(checkTime.stop().milliseconds);
            if (!result.allow) return sendTypedResp(result);
        }

        //Checking whitelist
        if (ctx.txAdmin.playerDatabase.config.whitelistMode === 'adminOnly') {
            const checkTime = new TimeCounter();
            const result = await checkAdminOnlyMode(ctx.txAdmin, validIdsArray, validIdsObject, playerName);
            ctx.txAdmin.statsManager.txRuntime.whitelistCheckTime.count(checkTime.stop().milliseconds);
            if (!result.allow) return sendTypedResp(result);

        } else if (ctx.txAdmin.playerDatabase.config.whitelistMode === 'approvedLicense') {
            const checkTime = new TimeCounter();
            const result = await checkApprovedLicense(ctx.txAdmin, validIdsArray, validIdsObject, validHwidsArray, playerName);
            ctx.txAdmin.statsManager.txRuntime.whitelistCheckTime.count(checkTime.stop().milliseconds);
            if (!result.allow) return sendTypedResp(result);

        } else if (ctx.txAdmin.playerDatabase.config.whitelistMode === 'guildMember') {
            const checkTime = new TimeCounter();
            const result = await checkGuildMember(ctx.txAdmin, validIdsArray, validIdsObject, playerName);
            ctx.txAdmin.statsManager.txRuntime.whitelistCheckTime.count(checkTime.stop().milliseconds);
            if (!result.allow) return sendTypedResp(result);

        } else if (ctx.txAdmin.playerDatabase.config.whitelistMode === 'guildRoles') {
            const checkTime = new TimeCounter();
            const result = await checkGuildRoles(ctx.txAdmin, validIdsArray, validIdsObject, playerName);
            ctx.txAdmin.statsManager.txRuntime.whitelistCheckTime.count(checkTime.stop().milliseconds);
            if (!result.allow) return sendTypedResp(result);
        }

        //If not blocked by ban/wl, allow join
        // return sendTypedResp({ allow: false, reason: 'APPROVED, BUT TEMP BLOCKED (DEBUG)' });
        return sendTypedResp({ allow: true });
    } catch (error) {
        const msg = `Failed to check ban/whitelist status: ${(error as Error).message}`;
        console.error(msg);
        console.verbose.dir(error);
        return sendTypedResp({ error: msg });
    }
};


/**
 * Checks if the player is banned
 */
function checkBan(
    txAdmin: TxAdmin,
    validIdsArray: string[],
    validIdsObject: PlayerIdsObjectType,
    validHwidsArray: string[]
): AllowRespType | DenyRespType {
    // Check active bans on matching identifiers
    const ts = now();
    const filter = (action: DatabaseActionType) => {
        return (
            action.type === 'ban'
            && (!action.expiration || action.expiration > ts)
            && (!action.revocation.timestamp)
        );
    };
    const activeBans = txAdmin.playerDatabase.getRegisteredActions(validIdsArray, validHwidsArray, filter);
    if (activeBans.length) {
        const ban = activeBans[0];

        //Translation keys
        const textKeys = {
            title_permanent: txAdmin.translator.t('ban_messages.reject.title_permanent'),
            title_temporary: txAdmin.translator.t('ban_messages.reject.title_temporary'),
            label_expiration: txAdmin.translator.t('ban_messages.reject.label_expiration'),
            label_date: txAdmin.translator.t('ban_messages.reject.label_date'),
            label_author: txAdmin.translator.t('ban_messages.reject.label_author'),
            label_reason: txAdmin.translator.t('ban_messages.reject.label_reason'),
            label_id: txAdmin.translator.t('ban_messages.reject.label_id'),
            note_multiple_bans: txAdmin.translator.t('ban_messages.reject.note_multiple_bans'),
            note_diff_license: txAdmin.translator.t('ban_messages.reject.note_diff_license'),
        };
        const language = txAdmin.translator.t('$meta.humanizer_language');

        //Ban data
        let title;
        let expLine = '';
        if (ban.expiration) {
            const humanizeOptions = {
                language,
                largest: 2,
                round: true,
                units: ['d', 'h', 'm'] as Unit[],
            };
            const duration = humanizeDuration((ban.expiration - ts) * 1000, humanizeOptions);
            expLine = `<strong>${textKeys.label_expiration}:</strong> ${duration} <br>`;
            title = textKeys.title_temporary;
        } else {
            title = textKeys.title_permanent;
        }
        const banDate = new Date(ban.timestamp * 1000).toLocaleString(
            txAdmin.translator.canonical,
            { dateStyle: 'medium', timeStyle: 'medium' }
        )

        //Ban author
        let authorLine = '';
        if (!txAdmin.globalConfig.hideAdminInPunishments) {
            authorLine = `<strong>${textKeys.label_author}:</strong> ${xss(ban.author)} <br>`;
        }

        //Informational notes
        let note = '';
        if (activeBans.length > 1) {
            note += `<br>${textKeys.note_multiple_bans}`;
        }
        const bannedLicense = ban.ids.find(id => id.startsWith('license:'));
        if (bannedLicense && validIdsObject.license && bannedLicense.substring(8) !== validIdsObject.license) {
            note += `<br>${textKeys.note_diff_license}`;
        }

        //Prepare rejection message
        const reason = rejectMessageTemplate(
            title,
            `${expLine}
            <strong>${textKeys.label_date}:</strong> ${banDate} <br>
            <strong>${textKeys.label_reason}:</strong> ${xss(ban.reason)} <br>
            <strong>${textKeys.label_id}:</strong> <codeid>${ban.id}</codeid> <br>
            ${authorLine}
            ${prepCustomMessage(txAdmin.playerDatabase.config.banRejectionMessage)}
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
    txAdmin: TxAdmin,
    validIdsArray: string[],
    validIdsObject: PlayerIdsObjectType,
    playerName: string
): Promise<AllowRespType | DenyRespType> {
    const textKeys = {
        mode_title: txAdmin.translator.t('whitelist_messages.admin_only.mode_title'),
        insufficient_ids: txAdmin.translator.t('whitelist_messages.admin_only.insufficient_ids'),
        deny_message: txAdmin.translator.t('whitelist_messages.admin_only.deny_message'),
    };

    //Check if fivem/discord ids are available
    if (!validIdsObject.license && !validIdsObject.discord) {
        return {
            allow: false,
            reason: rejectMessageTemplate(
                textKeys.mode_title,
                textKeys.insufficient_ids
            ),
        }
    }

    //Looking for admin
    const admin = txAdmin.adminVault.getAdminByIdentifiers(validIdsArray);
    if (admin) return { allow: true };

    //Prepare rejection message
    const reason = rejectMessageTemplate(
        textKeys.mode_title,
        `${textKeys.deny_message} <br>
        ${prepCustomMessage(txAdmin.playerDatabase.config.whitelistRejectionMessage)}`
    );
    return { allow: false, reason };
}


/**
 * Checks if the player is a discord guild member
 */
async function checkGuildMember(
    txAdmin: TxAdmin,
    validIdsArray: string[],
    validIdsObject: PlayerIdsObjectType,
    playerName: string
): Promise<AllowRespType | DenyRespType> {
    const guildname = `<guildname>${txAdmin.discordBot.guildName}</guildname>`;
    const textKeys = {
        mode_title: txAdmin.translator.t('whitelist_messages.guild_member.mode_title'),
        insufficient_ids: txAdmin.translator.t('whitelist_messages.guild_member.insufficient_ids'),
        deny_title: txAdmin.translator.t('whitelist_messages.guild_member.deny_title'),
        deny_message: txAdmin.translator.t('whitelist_messages.guild_member.deny_message', {guildname}),
    };

    //Check if discord id is available
    if (!validIdsObject.discord) {
        return {
            allow: false,
            reason: rejectMessageTemplate(
                textKeys.mode_title,
                textKeys.insufficient_ids
            ),
        }
    }

    //Resolving member
    let errorTitle, errorMessage;
    try {
        const { isMember, memberRoles } = await txAdmin.discordBot.resolveMemberRoles(validIdsObject.discord);
        if (isMember) {
            return { allow: true };
        } else {
            errorTitle = textKeys.deny_title;
            errorMessage = textKeys.deny_message;
        }
    } catch (error) {
        errorTitle = `Error validating Discord Guild Member Whitelist:`;
        errorMessage = `<code>${(error as Error).message}</code>`;
    }

    //Prepare rejection message
    const reason = rejectMessageTemplate(
        errorTitle,
        `${errorMessage} <br>
        ${prepCustomMessage(txAdmin.playerDatabase.config.whitelistRejectionMessage)}`
    );
    return { allow: false, reason };
}


/**
 * Checks if the player has specific discord guild roles
 */
async function checkGuildRoles(
    txAdmin: TxAdmin,
    validIdsArray: string[],
    validIdsObject: PlayerIdsObjectType,
    playerName: string
): Promise<AllowRespType | DenyRespType> {
    const guildname = `<guildname>${txAdmin.discordBot.guildName}</guildname>`;
    const textKeys = {
        mode_title: txAdmin.translator.t('whitelist_messages.guild_roles.mode_title'),
        insufficient_ids: txAdmin.translator.t('whitelist_messages.guild_roles.insufficient_ids'),
        deny_notmember_title: txAdmin.translator.t('whitelist_messages.guild_roles.deny_notmember_title'),
        deny_notmember_message: txAdmin.translator.t('whitelist_messages.guild_roles.deny_notmember_message', {guildname}),
        deny_noroles_title: txAdmin.translator.t('whitelist_messages.guild_roles.deny_noroles_title'),
        deny_noroles_message: txAdmin.translator.t('whitelist_messages.guild_roles.deny_noroles_message', {guildname}),
    };

    //Check if discord id is available
    if (!validIdsObject.discord) {
        return {
            allow: false,
            reason: rejectMessageTemplate(
                textKeys.mode_title,
                textKeys.insufficient_ids
            ),
        }
    }

    //Resolving member
    let errorTitle, errorMessage;
    try {
        const { isMember, memberRoles } = await txAdmin.discordBot.resolveMemberRoles(validIdsObject.discord);
        if (isMember) {
            const matchingRole = txAdmin.playerDatabase.config.whitelistedDiscordRoles
                .find((requiredRole) => memberRoles?.includes(requiredRole));
            if (matchingRole) {
                return { allow: true };
            } else {
                errorTitle = textKeys.deny_noroles_title;
                errorMessage = textKeys.deny_noroles_message;
            }
        } else {
            errorTitle = textKeys.deny_notmember_title;
            errorMessage = textKeys.deny_notmember_message;
        }
    } catch (error) {
        errorTitle = `Error validating Discord Role Whitelist:`;
        errorMessage = `<code>${(error as Error).message}</code>`;
    }

    //Prepare rejection message
    const reason = rejectMessageTemplate(
        errorTitle,
        `${errorMessage} <br>
        ${prepCustomMessage(txAdmin.playerDatabase.config.whitelistRejectionMessage)}`
    );
    return { allow: false, reason };
}


/**
 * Checks if the player has a whitelisted license
 */
async function checkApprovedLicense(
    txAdmin: TxAdmin,
    validIdsArray: string[],
    validIdsObject: PlayerIdsObjectType,
    validHwidsArray: string[],
    playerName: string
): Promise<AllowRespType | DenyRespType> {
    const textKeys = {
        mode_title: txAdmin.translator.t('whitelist_messages.approved_license.mode_title'),
        insufficient_ids: txAdmin.translator.t('whitelist_messages.approved_license.insufficient_ids'),
        deny_title: txAdmin.translator.t('whitelist_messages.approved_license.deny_title'),
        request_id_label: txAdmin.translator.t('whitelist_messages.approved_license.request_id_label'),
    };

    //Check if license is available
    if (!validIdsObject.license) {
        return {
            allow: false,
            reason: rejectMessageTemplate(
                textKeys.mode_title,
                textKeys.insufficient_ids
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
    const approvals = txAdmin.playerDatabase.getWhitelistApprovals(allIdsFilter);
    if (approvals.length) {
        //update or register player
        if (typeof player !== 'undefined' && player.license) {
            player.setWhitelist(true);
        } else {
            txAdmin.playerDatabase.registerPlayer({
                license: validIdsObject.license,
                ids: validIdsArray,
                hwids: validHwidsArray,
                displayName,
                pureName,
                playTime: 0,
                tsLastConnection: ts,
                tsJoined: ts,
                tsWhitelisted: ts,
            });
        }

        //Remove entries from whitelistApprovals & whitelistRequests
        txAdmin.playerDatabase.removeWhitelistApprovals(allIdsFilter);
        txAdmin.playerDatabase.removeWhitelistRequests({ license: validIdsObject.license });

        //return allow join
        return { allow: true };
    }


    //Player is not whitelisted
    //Resolve player discord
    let discordTag, discordAvatar;
    if (validIdsObject.discord && txAdmin.discordBot.isClientReady) {
        try {
            const { tag, avatar } = await txAdmin.discordBot.resolveMemberProfile(validIdsObject.discord);
            discordTag = tag;
            discordAvatar = avatar;
        } catch (error) { }
    }

    //Check if this player has an active wl request
    //NOTE: it could return multiple, but we are not dealing with it
    let wlRequestId: string;
    const requests = txAdmin.playerDatabase.getWhitelistRequests({ license: validIdsObject.license });
    if (requests.length) {
        wlRequestId = requests[0].id; //just getting the first
        txAdmin.playerDatabase.updateWhitelistRequests(validIdsObject.license, {
            playerDisplayName: displayName,
            playerPureName: pureName,
            discordTag,
            discordAvatar,
            tsLastAttempt: ts,
        });
    } else {
        wlRequestId = txAdmin.playerDatabase.registerWhitelistRequests({
            license: validIdsObject.license,
            playerDisplayName: displayName,
            playerPureName: pureName,
            discordTag,
            discordAvatar,
            tsLastAttempt: ts,
        });
        txAdmin.fxRunner.sendEvent('whitelistRequest', {
            action: 'requested',
            playerName: displayName,
            requestId: wlRequestId,
            license: validIdsObject.license,
        });
    }

    //Prepare rejection message
    const reason = rejectMessageTemplate(
        textKeys.deny_title,
        `<strong>${textKeys.request_id_label}:</strong>
        <codeid>${wlRequestId}</codeid> <br>
        ${prepCustomMessage(txAdmin.playerDatabase.config.whitelistRejectionMessage)}`
    );
    return { allow: false, reason }
}
