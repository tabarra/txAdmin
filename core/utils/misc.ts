import dateFormat from 'dateformat';

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
 * Returns the current time in HH:MM:ss format
 */
export const getTimeHms = (time?: string | number | Date) => dateFormat(time ?? new Date(), 'HH:MM:ss');


/**
 * Returns the current time in filename-friendly format
 */
export const getTimeFilename = (time?: string | number | Date) => dateFormat(time ?? new Date(), 'yyyy-mm-dd_HH-MM-ss');


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
 * Parses a number or string to a float with a limited precision.
 */
export const parseLimitedFloat = (src: number | string, precision = 6) => {
    const srcAsNum = typeof src === 'string' ? parseFloat(src) : src;
    return parseFloat(srcAsNum.toFixed(precision));
}
