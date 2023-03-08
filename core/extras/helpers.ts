import consts from "./consts";

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

        const hmRegex = /^$|^([01]?[0-9]|2[0-3]):([0-5][0-9])$/gm; //need to set it insde the loop
        const m = hmRegex.exec(timeTrim);
        if (m === null) {
            invalid.push(timeTrim);
        } else {
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
        .replace(/licenseKey\s+["']?(cfxk_\w{1,60}_\w{1,20}|\w{32})["']?/gi, 'licenseKey [REDACTED]')
        .replace(/steam_webApiKey\s+["']?\w{32}["']?/gi, 'steam_webApiKey [REDACTED]')
        .replace(/sv_tebexSecret\s+["']?\w{40}["']?/gi, 'sv_tebexSecret [REDACTED]')
        .replace(/rcon_password\s+["']?[^"']+["']?/gi, 'rcon_password [REDACTED]')
        .replace(/mysql_connection_string\s+["']?[^"']+["']?/gi, 'mysql_connection_string [REDACTED]');
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
        expiration = false;
    } else {
        const [multiplierInput, unit] = inputDuration.split(/\s+/);
        const multiplier = parseInt(multiplierInput);
        if (isNaN(multiplier) || multiplier < 1) {
            throw new Error(`The duration multiplier must be a number above 1.`);
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
    if (validator && validator.test(idString)) {
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


//Maybe extract to some shared folder
export type PlayerIdsObjectType = {
    discord: string | null;
    fivem: string | null;
    license: string | null;
    license2: string | null;
    live: string | null;
    steam: string | null;
    xbl: string | null;
};


/**
 * Validates if a redirect path is valid or not.
 * To prevent open redirect, we need to make sure the first char is / and the second is not,
 * otherwise //example.com would be a valid redirect to <proto>://example.com
 */
export const isValidRedirectPath = (redirPath: unknown) => typeof redirPath === 'string' && /^\/\w/.test(redirPath);
