import { PlayerDropEvent } from "@core/components/PlayerlistManager";
import { PDL_CRASH_REASON_CHAR_LIMIT, PDL_UNKNOWN_REASON_CHAR_LIMIT } from "./config";

const playerInitiatedRules = [
    `exiting`,//basically only see this one
    `disconnected.`, //need to keep the dot
    `connecting to another server`,
    `could not find requested level`,
    `entering rockstar editor`,
    `quit:`,
    `reconnecting`,
    `reloading game`,
];

//FIXME: remover essa categoria, checar com heron se os security podem vir como security ao invés de server-initiated
const serverInitiatedRules = [
    //NOTE: this is not a real drop reason prefix, but something that the client sees only
    `disconnected by server:`,

    //NOTE: Happens only when doing "quit xxxxxx" in live console
    `server shutting down:`,

    //NOTE: Happens when txAdmin players - but soon specific player kicks (instead of kick all)
    // will not fall under this category anymore
    `[txadmin]`,
];
const timeoutRules = [
    `server->client connection timed out`, //basically only see this one - FIXME: falta espaço?
    `connection timed out`,
    `timed out after 60 seconds`, //onesync timeout
];
const securityRules = [
    `reliable network event overflow`,
    `reliable network event size overflow:`,
    `reliable server command overflow`,
    `reliable state bag packet overflow`,
    `unreliable network event overflow`,
    `connection to cnl timed out`,
    `server command overflow`,
    `invalid client configuration. restart your game and reconnect`,
];

//The crash message prefix is translated, so we need to lookup the translations.
//This list covers the top 20 languages used in FiveM, with exceptions languages with no translations.
const crashRulesIntl = [
    // (en) English - 18.46%
    `game crashed: `,
    // (pt) Portuguese - 15.67%
    `o jogo crashou: `,
    // (fr) French - 9.58%
    `le jeu a cessé de fonctionner : `,
    // (de) German - 9.15%
    `spielabsturz: `,
    // (es) Spanish - 6.08%
    `el juego crasheó: `,
    // (ar) Arabic - 6.04%
    `تعطلت العبة: `,
    // (nl) Dutch - 2.46%
    `spel werkt niet meer: `,
    // (tr) Turkish - 1.37%
    `oyun çöktü: `,
    // (hu) Hungarian - 1.31%
    `a játék összeomlott: `,
    // (it) Italian - 1.20%
    `il gioco ha smesso di funzionare: `,
    // (zh) Chinese - 1.02%
    `游戏发生崩溃：`,
    `遊戲已崩潰: `,
    // (cs) Czech - 0.92%
    `pád hry: `,
    // (sv) Swedish - 0.69%
    `spelet kraschade: `,
];
const exceptionPrefixesIntl = [
    // (en) English - 18.46%
    `unhandled exception: `,
    // (pt) Portuguese - 15.67%
    `exceção não tratada: `,
    // (fr) French - 9.58%
    `exception non-gérée : `,
    // (de) German - 9.15%
    `unbehandelte ausnahme: `,
    // (es) Spanish - 6.08%
    `excepción no manejada: `,
    // (ar) Arabic - 6.04%
    `استثناء غير معالج: `,
    // (nl) Dutch - 2.46%
    // NOTE: Dutch doesn't have a translation for "unhandled exception"
    // (tr) Turkish - 1.37%
    `i̇şlenemeyen özel durum: `,
    // (hu) Hungarian - 1.31%
    `nem kezelt kivétel: `,
    // (it) Italian - 1.20%
    `eccezione non gestita: `,
    // (zh) Chinese - 1.02%
    `未处理的异常：`,
    `未處理的異常： `,
    // (cs) Czech - 0.92%
    `neošetřená výjimka: `,
    // (sv) Swedish - 0.69%
    `okänt fel: `,
];

const truncateReason = (reason: string, maxLength: number, prefix?: string) => {
    prefix = prefix ? `${prefix} ` : '';
    if (prefix) {
        maxLength -= prefix.length;
    }
    const truncationSuffix = '[truncated]';
    if (!reason.length) {
        return prefix + '[tx:empty-reason]';
    }else if (reason.length > maxLength) {
        return prefix + reason.slice(0, maxLength - truncationSuffix.length) + truncationSuffix;
    } else {
        return prefix + reason;
    }
}

const cleanCrashReason = (reason: string) => {
    const cutoffIdx = reason.indexOf(': ') + 2;
    const msg = reason.slice(cutoffIdx);
    const exceptionPrefix = exceptionPrefixesIntl.find((prefix) => msg.toLocaleLowerCase().startsWith(prefix));
    const saveMsg = exceptionPrefix
        ? 'Unhandled exception: ' + msg.slice(exceptionPrefix.length)
        : msg;
    return truncateReason(saveMsg, PDL_CRASH_REASON_CHAR_LIMIT);
}

/**
 * Classifies a drop reason into a category, and returns a cleaned up version of it.
 * The cleaned up version is truncated to a certain length.
 * The cleaned up version of crash reasons have the prefix translated back into English.
 */
const guessDropReasonCategory = (reason: string): ClassifyDropReasonResponse => {
    if (typeof reason !== 'string') {
        return {
            category: 'unknown' as const,
            cleanReason: '[tx:invalid-reason]',
        };
    }
    const reasonToMatch = reason.trim().toLocaleLowerCase();

    if (!reasonToMatch.length) {
        return {
            category: 'unknown' as const,
            cleanReason: '[tx:empty-reason]',
        };
    } else if (playerInitiatedRules.some((rule) => reasonToMatch.startsWith(rule))) {
        return { category: 'player' };
    } else if (serverInitiatedRules.some((rule) => reasonToMatch.startsWith(rule))) {
        return { category: false };
    } else if (timeoutRules.some((rule) => reasonToMatch.includes(rule))) {
        return { category: 'timeout' };
    } else if (securityRules.some((rule) => reasonToMatch.includes(rule))) {
        return { category: 'security' };
    } else if (crashRulesIntl.some((rule) => reasonToMatch.includes(rule))) {
        return {
            category: 'crash' as const,
            cleanReason: cleanCrashReason(reason),
        };
    } else {
        return {
            category: 'unknown' as const,
            cleanReason: truncateReason(reason, PDL_UNKNOWN_REASON_CHAR_LIMIT),
        };
    }
}

//NOTE: From fivem/code/components/citizen-server-impl/include/ClientDropReasons.h
export enum FxsDropReasonGroups {
    //1 resource dropped the client
    RESOURCE = 1,
    //2 client initiated a disconnect
    CLIENT,
    //3 server initiated a disconnect
    SERVER,
    //4 client with same guid connected and kicks old client
    CLIENT_REPLACED,
    //5 server -> client connection timed out
    CLIENT_CONNECTION_TIMED_OUT,
    //6 server -> client connection timed out with pending commands
    CLIENT_CONNECTION_TIMED_OUT_WITH_PENDING_COMMANDS,
    //7 server shutdown triggered the client drop
    SERVER_SHUTDOWN,
    //8 state bag rate limit exceeded
    STATE_BAG_RATE_LIMIT,
    //9 net event rate limit exceeded
    NET_EVENT_RATE_LIMIT,
    //10 latent net event rate limit exceeded
    LATENT_NET_EVENT_RATE_LIMIT,
    //11 command rate limit exceeded
    COMMAND_RATE_LIMIT,
    //12 too many missed frames in OneSync
    ONE_SYNC_TOO_MANY_MISSED_FRAMES,
};

const timeoutCategory = [
    FxsDropReasonGroups.CLIENT_CONNECTION_TIMED_OUT,
    FxsDropReasonGroups.CLIENT_CONNECTION_TIMED_OUT_WITH_PENDING_COMMANDS,
    FxsDropReasonGroups.ONE_SYNC_TOO_MANY_MISSED_FRAMES,
];
const securityCategory = [
    FxsDropReasonGroups.SERVER,
    FxsDropReasonGroups.CLIENT_REPLACED,
    FxsDropReasonGroups.STATE_BAG_RATE_LIMIT,
    FxsDropReasonGroups.NET_EVENT_RATE_LIMIT,
    FxsDropReasonGroups.LATENT_NET_EVENT_RATE_LIMIT,
    FxsDropReasonGroups.COMMAND_RATE_LIMIT,
];


/**
 * Classifies a drop reason into a category, and returns a cleaned up version of it.
 * The cleaned up version is truncated to a certain length.
 * The cleaned up version of crash reasons have the prefix translated back into English.
 */
export const classifyDrop = (payload: PlayerDropEvent): ClassifyDropReasonResponse => {
    if (typeof payload.reason !== 'string') {
        return {
            category: 'unknown',
            cleanReason: '[tx:invalid-reason]',
        };
    } else if (payload.category === undefined || payload.resource === undefined) {
        return guessDropReasonCategory(payload.reason);
    }

    if (typeof payload.category !== 'number' || payload.category <= 0) {
        return {
            category: 'unknown',
            cleanReason: truncateReason(
                payload.reason,
                PDL_UNKNOWN_REASON_CHAR_LIMIT,
                '[tx:invalid-category]'
            ),
        };
    } else if (payload.category === FxsDropReasonGroups.RESOURCE) {
        if (payload.resource === 'monitor') {
            //if server shutting down, return ignore, otherwise return server-initiated
            if (payload.reason === 'server_shutting_down') {
                return { category: false };
            } else {
                return {
                    category: 'resource',
                    resource: 'txAdmin'
                };
            }
        } else {
            return {
                category: 'resource',
                resource: payload.resource ? payload.resource : 'unknown',
            }
        }
    } else if (payload.category === FxsDropReasonGroups.CLIENT) {
        //check if it's crash
        const reasonToMatch = payload.reason.trim().toLocaleLowerCase();
        if (crashRulesIntl.some((rule) => reasonToMatch.includes(rule))) {
            return {
                category: 'crash',
                cleanReason: cleanCrashReason(payload.reason),
            }
        } else {
            return { category: 'player' };
        }
    } else if (timeoutCategory.includes(payload.category)) {
        return { category: 'timeout' };
    } else if (securityCategory.includes(payload.category)) {
        return { category: 'security' };
    } else if (payload.category === FxsDropReasonGroups.SERVER_SHUTDOWN) {
        return { category: false };
    } else {
        return {
            category: 'unknown',
            cleanReason: truncateReason(
                payload.reason,
                PDL_UNKNOWN_REASON_CHAR_LIMIT,
                '[tx:unknown-category]'
            ),
        };
    }
}
type SimpleDropCategory = 'player' | 'timeout' | 'security';
// type DetailedDropCategory = 'resource' | 'crash' | 'unknown';
// type DropCategories = SimpleDropCategory | DetailedDropCategory;


type ClassifyDropReasonResponse = {
    category: SimpleDropCategory;
} | {
    category: 'resource';
    resource: string;
} | {
    category: 'crash' | 'unknown';
    cleanReason: string;
} | {
    category: false; //server shutting down, ignore
}
