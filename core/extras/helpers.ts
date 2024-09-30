import type { PlayerIdsObjectType } from "@shared/otherTypes";
import consts from "../../shared/consts";

/**
 * txAdmin in ASCII
 */
let __ascii: string;
export const txAdminASCII = () => {
    //NOTE: precalculating the ascii art for efficiency
    // import figlet from 'figlet';
    // let ascii = figlet.textSync('txAdmin');
    // let b64 = Buffer.from(ascii).toString('base64');
    // console.log(b64);
    if (!__ascii) {
        const preCalculated = `ICBfICAgICAgICAgICAgXyAgICAgICBfICAgICAgICAgICBfICAgICAgIAogfCB8X19fICBfX
    yAgIC8gXCAgIF9ffCB8XyBfXyBfX18gKF8pXyBfXyAgCiB8IF9fXCBcLyAvICAvIF8gXCAvIF9gIHwgJ18gYCBfIFx8IHwg
    J18gXCAKIHwgfF8gPiAgPCAgLyBfX18gXCAoX3wgfCB8IHwgfCB8IHwgfCB8IHwgfAogIFxfXy9fL1xfXC9fLyAgIFxfXF9
    fLF98X3wgfF98IHxffF98X3wgfF98CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA=`;
        __ascii = Buffer.from(preCalculated, 'base64').toString('ascii');
    }
    return __ascii;
};


/**
 * Extracts hours and minutes from an string containing times
 */
export const parseSchedule = (scheduleTimes: string[]) => {
    const valid = [];
    const invalid = [];
    for (const timeInput of scheduleTimes) {
        if (typeof timeInput !== 'string') continue;
        const timeTrim = timeInput.trim();
        if (!timeTrim.length) continue;

        const hmRegex = /^([01]?[0-9]|2[0-4]):([0-5][0-9])$/gm;
        const m = hmRegex.exec(timeTrim);
        if (m === null) {
            invalid.push(timeTrim);
        } else {
            if (m[1] === '24') m[1] = '00'; //Americans, amirite?!?!
            valid.push({
                string: m[1].padStart(2, '0') + ':' + m[2].padStart(2, '0'),
                hours: parseInt(m[1]),
                minutes: parseInt(m[2]),
            });
        }
    }
    return { valid, invalid };
};


/**
 * Redacts sv_licenseKey, steam_webApiKey, sv_tebexSecret, and rcon_password from a string
 */
export const redactApiKeys = (src: string) => {
    if (typeof src !== 'string' || !src.length) return src;
    return src
        .replace(/licenseKey\s+["']?cfxk_\w{1,60}_(\w+)["']?.?$/gim, 'licenseKey [REDACTED cfxk...$1]')
        .replace(/steam_webApiKey\s+["']?\w{32}["']?.?$/gim, 'steam_webApiKey [REDACTED]')
        .replace(/sv_tebexSecret\s+["']?\w{40}["']?.?$/gim, 'sv_tebexSecret [REDACTED]')
        .replace(/rcon_password\s+["']?[^"']+["']?.?$/gim, 'rcon_password [REDACTED]')
        .replace(/mysql_connection_string\s+["']?[^"']+["']?.?$/gim, 'mysql_connection_string [REDACTED]')
        .replace(/discord\.com\/api\/webhooks\/\d{17,20}\/\w{10,}.?$/gim, 'discord.com/api/webhooks/[REDACTED]/[REDACTED]');
};


/**
 * Returns the unix timestamp in seconds.
 */
export const now = () => Math.round(Date.now() / 1000);


/**
 * Returns false if any argument is undefined
 */
export const anyUndefined = (...args: any) => [...args].some((x) => (typeof x === 'undefined'));


/**
 * Calculates expiration and duration from a ban duration string like "1 day"
 */
export const calcExpirationFromDuration = (inputDuration: string) => {
    let expiration;
    let duration;
    if (inputDuration === 'permanent') {
        expiration = false as const;
    } else {
        const [multiplierInput, unit] = inputDuration.split(/\s+/);
        const multiplier = parseInt(multiplierInput);
        if (isNaN(multiplier) || multiplier < 1) {
            throw new Error(`The duration number must be at least 1.`);
        }

        if (unit.startsWith('hour')) {
            duration = multiplier * 3600;
        } else if (unit.startsWith('day')) {
            duration = multiplier * 86400;
        } else if (unit.startsWith('week')) {
            duration = multiplier * 604800;
        } else if (unit.startsWith('month')) {
            duration = multiplier * 2592000; //30 days
        } else {
            throw new Error(`Invalid ban duration. Supported units: hours, days, weeks, months`);
        }
        expiration = now() + duration;
    }

    return { expiration, duration };
};


/**
 * Validates a single identifier and return its parts lowercased
 */
export const parsePlayerId = (idString: string) => {
    if (typeof idString !== 'string') {
        return { isIdValid: false, idType: null, idValue: null, idlowerCased: null };
    }

    const idlowerCased = idString.toLocaleLowerCase();
    const [idType, idValue] = idlowerCased.split(':', 2);
    const validator = consts.validIdentifiers[idType as keyof typeof consts.validIdentifiers];
    if (validator && validator.test(idlowerCased)) {
        return { isIdValid: true, idType, idValue, idlowerCased };
    } else {
        return { isIdValid: false, idType, idValue, idlowerCased };
    }
}


/**
 * Get valid, invalid and license identifier from array of ids
 */
export const parsePlayerIds = (ids: string[]) => {
    let invalidIdsArray: string[] = [];
    let validIdsArray: string[] = [];
    const validIdsObject: PlayerIdsObjectType = {
        discord: null,
        fivem: null,
        license: null,
        license2: null,
        live: null,
        steam: null,
        xbl: null,
    }

    for (const idString of ids) {
        if (typeof idString !== 'string') continue;
        const { isIdValid, idType, idValue } = parsePlayerId(idString);
        if (isIdValid) {
            validIdsArray.push(idString);
            validIdsObject[idType as keyof PlayerIdsObjectType] = idValue;
        } else {
            invalidIdsArray.push(idString);
        }
    }

    return { invalidIdsArray, validIdsArray, validIdsObject };
}


/**
 * Get valid and invalid player HWIDs
 */
export const filterPlayerHwids = (hwids: string[]) => {
    let invalidHwidsArray: string[] = [];
    let validHwidsArray: string[] = [];

    for (const hwidString of hwids) {
        if (typeof hwidString !== 'string') continue;
        if (consts.regexValidHwidToken.test(hwidString)) {
            validHwidsArray.push(hwidString);
        } else {
            invalidHwidsArray.push(hwidString);
        }
    }

    return { invalidHwidsArray, validHwidsArray };
}


/**
 * Attempts to parse a user-provided string into an array of valid identifiers.
 * This function is lenient and will attempt to parse any string into an array of valid identifiers.
 * For non-prefixed ids, it will attempt to parse it as discord, fivem, steam, or license.
 * Returns an array of valid ids/hwids, and array of invalid identifiers.
 * 
 * Stricter version of this function is parsePlayerIds
 */
export const parseLaxIdsArrayInput = (fullInput: string) => {
    const validIds: string[] = [];
    const validHwids: string[] = [];
    const invalids: string[] = [];

    if (typeof fullInput !== 'string') {
        return { validIds, validHwids, invalids };
    }
    const inputs = fullInput.toLowerCase().split(/[,;\s]+/g).filter(Boolean);

    for (const input of inputs) {
        if (input.includes(':')) {
            if (consts.regexValidHwidToken.test(input)) {
                validHwids.push(input);
            } else if (Object.values(consts.validIdentifiers).some((regex) => regex.test(input))) {
                validIds.push(input);
            } else {
                const [type, value] = input.split(':', 1);
                if (consts.validIdentifierParts[type as keyof typeof consts.validIdentifierParts]?.test(value)) {
                    validIds.push(input);
                } else {
                    invalids.push(input);
                }
            }
        } else if (consts.validIdentifierParts.discord.test(input)) {
            validIds.push(`discord:${input}`);
        } else if (consts.validIdentifierParts.fivem.test(input)) {
            validIds.push(`fivem:${input}`);
        } else if (consts.validIdentifierParts.license.test(input)) {
            validIds.push(`license:${input}`);
        } else if (consts.validIdentifierParts.steam.test(input)) {
            validIds.push(`steam:${input}`);
        } else {
            invalids.push(input);
        }
    }

    return { validIds, validHwids, invalids };
}



/**
 * Extracts the fivem:xxxxxx identifier from the nameid field from the userInfo oauth response.
 * Example: https://forum.cfx.re/internal/user/271816 -> fivem:271816
 */
export const getIdFromOauthNameid = (nameid: string) => {
    try {
        const res = /\/user\/(\d{1,8})/.exec(nameid);
        //@ts-expect-error
        return `fivem:${res[1]}`;
    } catch (error) {
        return false;
    }
}


/**
 * Parses a number or string to a float with a limited precision.
 */
export const parseLimitedFloat = (src: number | string, precision = 6) => {
    const srcAsNum = typeof src === 'string' ? parseFloat(src) : src;
    return parseFloat(srcAsNum.toFixed(precision));
}
