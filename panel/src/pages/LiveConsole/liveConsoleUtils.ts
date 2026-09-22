import { copyToClipboard } from "@/lib/utils";
import { TimestampMode } from "./xtermOptions";
import { ANSI } from "./liveConsoleColors";
import { parseFrameHeader, renderFxsChannelBracket, type FrameHeader } from "@shared/consoleFrames";


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
 * Extracts the line header (timestamp, level, channel, etc) from a term line.
 * Protocol defined in shared/consoleFrames.ts.
 * Lines without a header are continuations of the previous line (or bare line breaks).
 */
export type TermLineHeader = FrameHeader & { ts: number };
export const extractTermLineHeader = (line: string): { header: TermLineHeader | null, content: string } => {
    const header = parseFrameHeader(line);
    if (!header) {
        return { header: null, content: line };
    }
    return {
        header: { ...header, ts: parseInt(header.tsHex, 16) },
        content: line.slice(header.bodyStart),
    };
}


/**
 * Renders the channel prefix of an fxserver line, in the same format fxserver prints it:
 * `<channelColor>[<channel>]<reset> `
 * NOTE: the level is deliberately not rendered, it is only recorded for the filters.
 */
const fxsChannelPrefixCache = new Map<string, string>();
const fxsChannelPrefixCacheMax = 512;
export const formatFxsLinePrefix = (color: string, channel: string) => {
    const key = color + '\x1f' + channel;
    let channelPrefix = fxsChannelPrefixCache.get(key);
    if (channelPrefix === undefined) {
        const bracket = renderFxsChannelBracket(channel);
        channelPrefix = color
            ? `\x1b[38;5;${color}m${bracket}${ANSI.RESET} `
            : `${bracket} `;
        if (fxsChannelPrefixCache.size >= fxsChannelPrefixCacheMax) fxsChannelPrefixCache.clear();
        fxsChannelPrefixCache.set(key, channelPrefix);
    }
    return channelPrefix;
}


/**
 * Formats a timestamp into a console prefix
 */
export const formatTermTimestamp = (ts: number, timestampMode: TimestampMode): string => {
    if (timestampMode === 'DISABLED') return ANSI.RESET;
    const time = new Date(ts * 1000);
    const str = time.toLocaleTimeString(
        'en-US', //as en-gb uses 4 digits for the am/pm indicator
        {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: timestampMode === 'FORCE12H' ? true :
                timestampMode === 'FORCE24H' ? false :
                    window.txBrowserHour12,
        }
    );

    // adding ansi reset to prevent color bleeding
    return str + ANSI.RESET + ' ';
}


export const getEmptyTermTimestamp = (timestampMode: TimestampMode) => {
    return formatTermTimestamp(Date.now(), timestampMode).replace(/\w/g, '-');
}

/**
 * Filters a string to be copied to the clipboard
 */
export const filterTermLine = (
    selection: string,
    copyTimestamp: boolean,
    copyTag: boolean
) => {
    if (copyTimestamp && copyTag) return selection;
    //Tag formats: gen8 `[<20 chars>] `, gen9 `[<16 chars>] ` (see formatFxsLinePrefix)
    const lineRegex = /^(?<ts>\d{2}:\d{2}:\d{2}(?: [AP]M)? )?(?<tag>\[.{20}] |\[.{16}] )?(?<content>.*)?/;
    const match = selection.match(lineRegex);
    if (!match) return selection;
    const { ts, tag, content } = match.groups ?? {};
    let prefix = '';
    if (copyTimestamp) prefix += ts ?? '';
    if (copyTag) prefix += tag ?? '';
    return prefix + (content ?? '').trimEnd();
}


/**
 * Copies a string to the clipboard
 */
export const copyTermLine = async (
    selection: string,
    divRef: HTMLDivElement,
    copyTimestamp: boolean,
    copyTag: boolean,
    returnFocusTo: HTMLElement | null = null
) => {
    const strToCopy = selection
        .split(/\r?\n/)
        .map(line => filterTermLine(line, copyTimestamp, copyTag))
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
