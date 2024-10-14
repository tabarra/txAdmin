import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Socket, io } from "socket.io-client";
import type { BanDurationType } from "@shared/otherTypes";
import { ListenEventsMap } from "@shared/socketioTypes";


/**
 * clsx then tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
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
 * Converts a number to a locale string with commas and decimals
 */
export const numberToLocaleString = (num: number, decimals = 0) => {
    return num.toLocaleString(
        window.txBrowserLocale,
        { maximumFractionDigits: decimals }
    );
};


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
