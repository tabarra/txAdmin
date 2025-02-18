/**
 * Splits a string into two parts: the first line and the rest of the string.
 * Returns an object indicating whether an end-of-line (EOL) character was found.
 * If the string ends with a line break, `rest` is set to `undefined`.
 * Supports both Unix (`\n`) and Windows (`\r\n`) line breaks.
 */
export const splitFirstLine = (str: string): SplitFirstLineResult => {
    const firstEolIndex = str.indexOf('\n');
    if (firstEolIndex === -1) {
        return { first: str, rest: undefined, eol: false };
    }

    const isEolCrLf = firstEolIndex > 0 && str[firstEolIndex - 1] === '\r';
    const foundEolLength = isEolCrLf ? 2 : 1;
    const firstEolAtEnd = firstEolIndex === str.length - foundEolLength;
    if (firstEolAtEnd) {
        return { first: str, rest: undefined, eol: true };
    }

    const first = str.substring(0, firstEolIndex + foundEolLength);
    const rest = str.substring(firstEolIndex + foundEolLength);
    const eol = rest[rest.length - 1] === '\n';
    return { first, rest, eol };
};
type SplitFirstLineResult = {
    first: string;
    rest: string | undefined;
    eol: boolean;
};


/**
 * Strips the last end-of-line (EOL) character from a string.
 */
export const stripLastEol = (str: string) => {
    if (str.endsWith('\r\n')) {
        return {
            str: str.slice(0, -2),
            eol: '\r\n',
        }
    } else if (str.endsWith('\n')) {
        return {
            str: str.slice(0, -1),
            eol: '\n',
        }
    }
    return { str, eol: '' };
}


/**
 * Adds a given prefix to each line in the input string.
 * Does not add a prefix to the very last empty line, if it exists.
 * Efficiently handles strings without line breaks by returning the prefixed string.
 */
export const prefixMultiline = (str: string, prefix: string): string => {
    if (str.length === 0 || str === '\n') return '';
    let newlineIndex = str.indexOf('\n');

    // If there is no newline, append the whole string and return
    if (newlineIndex === -1 || newlineIndex === str.length - 1) {
        return prefix + str;
    }

    let result = prefix; // Start by prefixing the first line
    let start = 0;
    while (newlineIndex !== -1 && newlineIndex !== str.length - 1) {
        result += str.substring(start, newlineIndex + 1) + prefix;
        start = newlineIndex + 1;
        newlineIndex = str.indexOf('\n', start);
    }

    // Append the remaining part of the string after the last newline
    return result + str.substring(start);
};
