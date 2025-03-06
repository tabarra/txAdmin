import { copyToClipboard } from "@/lib/utils";
import { LiveConsoleOptions } from "./LiveConsolePage";


//ANSII escape codes
export const ANSI = {
    WHITE: '\x1B[0;37m',
    GRAY: '\x1B[1;90m',
    YELLOW: '\x1B[0;33m',
    RESET: '\x1B[0m',
} as const;


//Yoinked from core/modules/Logger/FXServerLogger/index.ts
const regexControls = /[\x00-\x08\x0B-\x1A\x1C-\x1F\x7F]|(?:\x1B\[|\x9B)[\d;]+[@-K]/g;
const regexColors = /\x1B[^m]*?m/g;


/**
 * Sanitizes a term line from control characters and colors
 */
export const sanitizeTermLine = (data: string) => {
    return data.replace(regexControls, '').replace(regexColors, '');
}


/**
 * Extracts the timestamp from a term line.
 * Format defined in core/modules/Logger/FXServerLogger/ConsoleTransformer.ts
 */
export const extractTermLineTimestamp = (line: string) => {
    if (/^{§[0-9a-f]{8}}/.test(line)) {
        return {
            ts: parseInt(line.slice(2, 10), 16),
            content: line.slice(11),
        };
    } else {
        return {
            ts: null,
            content: line,
        };
    }
}


/**
 * Formats a timestamp into a console prefix
 */
export const formatTermTimestamp = (ts: number, opts: LiveConsoleOptions): string => {
    if (opts.timestampDisabled) return '';
    const time = new Date(ts * 1000);
    const str = time.toLocaleTimeString(
        'en-US', //as en-gb uses 4 digits for the am/pm indicator
        {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: opts.timestampForceHour12 ?? window.txBrowserHour12,
        }
    );

    // adding ansi reset to prevent color bleeding
    return str + ANSI.RESET + ' ';
}


/**
 * Filters a string to be copied to the clipboard
 */
export const filterTermLine = (selection: string, opts: LiveConsoleOptions) => {
    if (opts.copyTimestamp && opts.copyTag) return selection;
    const lineRegex = /^(?<ts>\d{2}:\d{2}:\d{2}(?: [AP]M)? )?(?<tag>\[.{20}] )?(?<content>.*)?/;
    const match = selection.match(lineRegex);
    if (!match) return selection;
    const { ts, tag, content } = match.groups ?? {};
    let prefix = '';
    if (opts.copyTimestamp) prefix += ts ?? '';
    if (opts.copyTag) prefix += tag ?? '';
    return prefix + (content ?? '').trimEnd();
}


/**
 * Copies a string to the clipboard
 */
export const copyTermLine = async (
    selection: string,
    divRef: HTMLDivElement,
    opts: LiveConsoleOptions,
    returnFocusTo: HTMLElement | null = null
) => {
    const strToCopy = selection
        .split(/\r?\n/)
        .map(line => filterTermLine(line, opts))
        .join('\r\n') //assuming the user is on windows
        .replace(/(\r?\n)+$/, '\r\n'); //single one at the end, if any
    return copyToClipboard(strToCopy, divRef, returnFocusTo);
}


/**
 * Get the number of font-mono variants loaded
 */
export const getNumFontVariantsLoaded = (cssVar: string, label: string) => {
    console.groupCollapsed('getNumFontVariantsLoaded:', label);

    //This is required because in firefox, font.family has " and in chrome it doesn't
    const normalizeFamily = (family: string) => family.toLowerCase().replace(/^["']|["']$/g, '');

    //first we need to resolve what is the var(--font-mono) value
    if (!cssVar) return 0;
    const fontFamily = normalizeFamily(getComputedStyle(document.documentElement).getPropertyValue(cssVar));
    if (!fontFamily) {
        console.error('No --font-mono value found');
        return 0;
    }
    console.log('--font-mono:', fontFamily);

    let loadedCount = 0;
    for (const font of document.fonts) {
        if (normalizeFamily(font.family) !== fontFamily) continue;
        const isLoaded = font.status === 'loaded';
        const color = isLoaded ? 'green' : 'red';
        console.log(`%c${font.status}:`, `color: ${color}`, font.unicodeRange);
        if (isLoaded) loadedCount++;
    }

    console.log('Loaded:', loadedCount);
    console.groupEnd();
    return loadedCount;
}
