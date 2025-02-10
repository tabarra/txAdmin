import { copyToClipboard } from "@/lib/utils";
import { LiveConsoleOptions } from "./LiveConsolePage";

//Yoinked from the internet, no good source
const rtlRangeRegex = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]{3,}/; //ignoring anything less than 3 characters

//Yoinked from core/modules/Logger/FXServerLogger/index.ts
const regexControls = /[\x00-\x08\x0B-\x1A\x1C-\x1F\x7F]|(?:\x1B\[|\x9B)[\d;]+[@-K]/g;
const regexColors = /\x1B[^m]*?m/g;


/**
 * Checks if a string contains RTL characters
 */
export const hasRtlChars = (str: string) => rtlRangeRegex.test(str);


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
    const offset10hMs = 10 * 60 * 60 * 1000;
    const time = new Date(ts * 1000 + offset10hMs);
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
    return str + '\x1B[0m' + ' ';
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
    return prefix + (content ?? '');
}


/**
 * Copies a string to the clipboard
 */
export const copyTermLine = async (selection: string, divRef: HTMLDivElement, opts: LiveConsoleOptions) => {
    const strToCopy = selection
        .split(/\r?\n/)
        .map(line => filterTermLine(line, opts))
        .join('\r\n');
    return copyToClipboard(strToCopy, divRef);
}
