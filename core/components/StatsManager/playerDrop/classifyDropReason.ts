import { PDL_CRASH_REASON_CHAR_LIMIT, PDL_UNKNOWN_REASON_CHAR_LIMIT } from "./config";

const userInitiatedRules = [
    `exiting`,//basically only see this one
    `disconnected.`, //need to keep the dot
    `connecting to another server`,
    `could not find requested level`,
    `entering rockstar editor`,
    `quit:`,
    `reconnecting`,
    `reloading game`,
];
const serverInitiatedRules = [
    `disconnected by server:`,
    `server shutting down:`,
    `[txadmin]`,
];
const timeoutRules = [
    `server->client connection timed out`, //basically only see this one
    `connection timed out`,
    `fetching info timed out`,
    `timed out after 60 seconds`,
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
]

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
const exceptionRulesIntl = [
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

const truncateReason = (reason: string, maxLength: number) => {
    const truncationSuffix = '[truncated]';
    if(reason.length > maxLength){
        return reason.slice(0, maxLength - truncationSuffix.length) + truncationSuffix;
    } else {
        return reason;
    }
}


/**
 * Classifies a drop reason into a category, and returns a cleaned up version of it.
 * The cleaned up version is truncated to a certain length.
 * The cleaned up version of crash reasons have the prefix translated back into English.
 */
export const classifyDropReason = (reason: string) => {
    if (typeof reason !== 'string') {
        return { category: 'unknown' };
    }
    const reasonToMatch = reason.trim().toLocaleLowerCase();

    if (!reasonToMatch.length) {
        return { category: 'unknown' };
    } else if (userInitiatedRules.some((rule) => reasonToMatch.startsWith(rule))) {
        return { category: 'user-initiated' };
    } else if (serverInitiatedRules.some((rule) => reasonToMatch.startsWith(rule))) {
        return { category: 'server-initiated' };
    } else if (timeoutRules.some((rule) => reasonToMatch.includes(rule))) {
        return { category: 'timeout' };
    } else if (securityRules.some((rule) => reasonToMatch.includes(rule))) {
        return { category: 'security' };
    } else if (crashRulesIntl.some((rule) => reasonToMatch.includes(rule))) {
        const cutoffIdx = reason.indexOf(': ') + 2;
        const msg = 'Game crashed: ' + reason.slice(cutoffIdx);
        return {
            cleanReason: truncateReason(msg, PDL_CRASH_REASON_CHAR_LIMIT),
            category: 'crash'
        };
    } else if (exceptionRulesIntl.some((rule) => reasonToMatch.includes(rule))) {
        const cutoffIdx = reason.indexOf(': ') + 2;
        const msg = 'Unhandled exception: ' + reason.slice(cutoffIdx);
        return {
            cleanReason: truncateReason(msg, PDL_CRASH_REASON_CHAR_LIMIT),
            category: 'crash'
        };
    } else {
        return {
            cleanReason: truncateReason(reason, PDL_UNKNOWN_REASON_CHAR_LIMIT),
            category: 'unknown'
        };
    }
}
