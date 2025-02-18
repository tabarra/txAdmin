import humanizeDuration from '@/lib/humanizeDuration';
import type { HumanizerOptions } from "humanize-duration";

//Statically caching the current year
const currentYear = new Date().getFullYear();

/**
 * Converts a number of milliseconds to english words
 * Accepts a humanizeDuration config object
 * eg: msToDuration(ms, { units: ['h', 'm'] });
 */
export const msToDuration = humanizeDuration.humanizer({
    round: true,
    fallbacks: ['en'],
} satisfies HumanizerOptions);


/**
 * Converts a number of milliseconds to short english words
 * Accepts a humanizeDuration config object
 * eg: msToDuration(ms, { units: ['h', 'm'] });
 */
export const msToShortDuration = humanizeDuration.humanizer({
    round: true,
    spacer: '',
    language: 'shortEn',
    fallbacks: ['en'],
} satisfies HumanizerOptions);


/**
 * Converts a timestamp to Date, detecting if ts is seconds or milliseconds
 */
export const tsToDate = (ts: number) => {
    return new Date(ts < 10000000000 ? ts * 1000 : ts);
}


/**
 * Converts a timestamp to a locale time string
 */
export const dateToLocaleTimeString = (
    time: Date,
    hour: 'numeric' | '2-digit' = '2-digit',
    minute: 'numeric' | '2-digit' = '2-digit',
    second?: 'numeric' | '2-digit',
    hour12?: boolean,
) => {
    return time.toLocaleTimeString(
        window.txBrowserLocale,
        { hour, minute, second, hour12 }
    );
}


/**
 * Converts a timestamp to a locale time string
 */
export const tsToLocaleTimeString = (
    ts: number,
    hour: 'numeric' | '2-digit' = '2-digit',
    minute: 'numeric' | '2-digit' = '2-digit',
    second?: 'numeric' | '2-digit',
    hour12?: boolean,
) => {
    return dateToLocaleTimeString(tsToDate(ts), hour, minute, second, hour12);
}


/**
 * Converts a timestamp to a locale date string
 */
export const dateToLocaleDateString = (
    time: Date,
    dateStyle: 'full' | 'long' | 'medium' | 'short' = 'long',
) => {
    return time.toLocaleDateString(
        window.txBrowserLocale,
        { dateStyle }
    );
}


/**
 * Converts a timestamp to a locale date string
 */
export const tsToLocaleDateString = (
    ts: number,
    dateStyle: 'full' | 'long' | 'medium' | 'short' = 'long',
) => {
    return dateToLocaleDateString(tsToDate(ts), dateStyle);
}


/**
 * Translates a timestamp into a localized date time string
 */
export const dateToLocaleDateTimeString = (
    time: Date,
    dateStyle: 'full' | 'long' | 'medium' | 'short' = 'long',
    timeStyle: 'full' | 'long' | 'medium' | 'short' = 'medium',
) => {
    return time.toLocaleString(
        window.txBrowserLocale,
        { dateStyle, timeStyle }
    );
}


/**
 * Translates a timestamp into a localized date time string
 */
export const tsToLocaleDateTimeString = (
    ts: number,
    dateStyle: 'full' | 'long' | 'medium' | 'short' = 'long',
    timeStyle: 'full' | 'long' | 'medium' | 'short' = 'medium',
) => {
    return dateToLocaleDateTimeString(tsToDate(ts), dateStyle, timeStyle);
}


/**
 * Checks if a date is today
 */
export const isDateToday = (date: Date) => {
    const today = new Date();
    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
};


/**
 * Converts a timestamp to a locale time string, considering the current year, shortest unambiguous as possible
 */
export const convertRowDateTime = (ts: number) => {
    const date = tsToDate(ts);
    const isAnotherYear = date.getFullYear() !== currentYear;
    return date.toLocaleString(
        window.txBrowserLocale,
        {
            year: isAnotherYear ? 'numeric' : undefined,
            month: isAnotherYear ? 'numeric' : 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }
    );
}
