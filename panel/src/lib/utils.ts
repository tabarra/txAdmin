import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import humanizeDuration from '@/lib/humanizeDuration';
import { Socket, io } from "socket.io-client";
import type { HumanizerOptions } from "humanize-duration";
import type { BanDurationType } from "@shared/otherTypes";
import { ListenEventsMap } from "@shared/socketioTypes";
import { LogoutReasonHash } from "@/pages/auth/Login";

//Statically caching the current year
const currentYear = new Date().getFullYear();


/**
 * clsx then tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}


/**
 * Validates if a redirect path is valid or not.
 * To prevent open redirect, we need to make sure the first char is / and the second is not,
 * otherwise //example.com would be a valid redirect to <proto>://example.com
 */
export function isValidRedirectPath(location: unknown): location is string {
    if (typeof location !== 'string' || !location) return false;
    const url = new URL(location, window.location.href);
    return location.startsWith('/') && !location.startsWith('//') && url.hostname === window.location.hostname;
}


/**
 * Returns the path/search/hash of the login URL with redirect params
 * /aaa/bbb?ccc=ddd#eee -> /login?r=%2Faaa%2Fbbb%3Fccc%3Dddd%23eee
 */
export function redirectToLogin(reasonHash = LogoutReasonHash.NONE) {
    const currLocation = window.location.pathname + window.location.search + window.location.hash;
    const newLocation = currLocation === '/' || currLocation.startsWith('/login')
        ? `/login${reasonHash}`
        : `/login?r=${encodeURIComponent(currLocation)}${reasonHash}`;
    window.history.replaceState(null, '', newLocation);
}


/**
 * Removes the indentation of multiline strings based on the minimum length of indentation
 */
export const stripIndent = (src: string) => {
    const indentSearchRegex = /^[ \t]*(?=\S)/gm;
    const indents = src.substring(src.indexOf('\n')).match(indentSearchRegex);
    if (!indents) return src;
    const minIndent = indents.reduce((r, a) => Math.min(r, a.length), Infinity);
    const indentRemoverRegex = new RegExp(`^[ \\t]{${minIndent}}`, 'gm');
    return src.replace(indentRemoverRegex, '');
};


/**
 * Converts a number of milliseconds to english words
 * Accepts a humanizeDuration config object
 * eg: msToDuration(ms, { units: ['h', 'm'] });
 */
export const msToDuration = humanizeDuration.humanizer({
    round: true,
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
 * Converts a number to a locale string with commas and decimals
 */
export const numberToLocaleString = (num: number, decimals = 0) => {
    return num.toLocaleString(
        window.txBrowserLocale,
        { maximumFractionDigits: decimals }
    );
};


/**
 * Converts a timestamp to a locale time string, considering the current year, shortest unambiguous as possible
 */
export const convertRowDateTime = (ts: number) => {
    const date = tsToDate(ts);
    const isAnotheryear = date.getFullYear() !== currentYear;
    return date.toLocaleString(
        window.txBrowserLocale,
        {
            year: isAnotheryear ? 'numeric' : undefined,
            month: isAnotheryear ? 'numeric' : 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }
    );
}


/**
 * Returns a socket.io client instance
 */
export const getSocket = (rooms: string[] | string) => {
    const socketOpts = {
        transports: ['polling'],
        upgrade: false,
        query: {
            rooms,
            uiVersion: window.txConsts.txaVersion,
        }
    };

    const socket = window.txConsts.isWebInterface
        ? io({ ...socketOpts, path: '/socket.io' })
        : io('monitor', { ...socketOpts, path: '/WebPipe/socket.io' });

    //Can't use the generic type on io(), so need to apply it here
    return socket as Socket<ListenEventsMap, any>;
}


/**
 * Opens a link in a new tab, or calls the native function to open a link in the default browser
 */
export const openExternalLink = (url: string) => {
    if (!url) return;
    if (window.invokeNative) {
        window.invokeNative('openUrl', url);
    } else {
        window.open(url, '_blank');
    }
}


/**
 * Overwrites the href behavior in NUI to open external links
 */
export const handleExternalLinkClick = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (window.txConsts.isWebInterface) return;
    const target = event.target as HTMLElement;
    const anchor = target.closest('a');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href) return;

    event.preventDefault();
    openExternalLink(href);
}


/**
 * Returns a random hsl() color - useful for testing react rendering stuff
 */
export const createRandomHslColor = (alpha?: number) => {
    const hue = Math.floor(Math.random() * 360);
    return typeof alpha === 'number'
        ? `hsla(${hue}, 100%, 50%, ${alpha})`
        : `hsl(${hue}, 100%, 50%)`
}


/**
 * Copy text to clipboard.
 * Because we don't have access to Clipboard API in FiveM's CEF, as well as on
 * non-localhost origins without https, we need to use the old school method.
 * FIXME: literally not working
 */
export const copyToClipboard = async (value: string) => {
    if (navigator?.clipboard) {
        return navigator.clipboard.writeText(value);
    } else {
        const clipElem = document.createElement("textarea");
        clipElem.value = value;
        document.body.appendChild(clipElem);
        clipElem.select();
        const result = document.execCommand("copy");
        document.body.removeChild(clipElem);
        return result;
    }
}


/**
 * Converts the duration object to a lowercase string with correct unit pluralization
 */
export const banDurationToString = (duration: BanDurationType) => {
    if (duration === 'permanent') return 'permanent';
    if (typeof duration === 'string') return duration;
    const pluralizedString = duration.value === 1 ? duration.unit.slice(0, -1) : duration.unit;
    return `${duration.value} ${pluralizedString}`;
}


/**
 * Converts the duration object to a short string
 */
export const banDurationToShortString = (duration: BanDurationType) => {
    if (typeof duration === 'string') {
        return duration === 'permanent' ? 'PERM' : duration;
    }

    let suffix: string;
    if (duration.unit === 'hours') {
        suffix = 'h';
    } else if (duration.unit === 'days') {
        suffix = 'd';
    } else if (duration.unit === 'weeks') {
        suffix = 'w';
    } else if (duration.unit === 'months') {
        suffix = 'mo';
    } else {
        suffix = duration.unit;
    }
    return `${duration.value}${suffix}`;
}


/**
 * Sets a URL search param with a given value, or deletes it if value is undefined
 */
export const setUrlSearchParam = (paramName: string, ref: string | undefined) => {
    if (typeof paramName !== 'string' || !paramName.length) {
        throw new Error(`setUrlSearchParam: paramName must be a non-empty string`);
    }
    const pageUrl = new URL(window.location.toString());
    if (ref) {
        pageUrl.searchParams.set(paramName, ref);
    } else {
        pageUrl.searchParams.delete(paramName);
    }
    window.history.replaceState({}, '', pageUrl);
}
