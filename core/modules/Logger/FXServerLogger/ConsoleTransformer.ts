import { prefixMultiline, splitFirstLine, stripLastEol } from './fxsLoggerUtils';
import { ConsoleLineType } from './index';
import chalk, { ChalkInstance } from 'chalk';


//Types
export type MultiBuffer = {
    webBuffer: string;
    stdoutBuffer: string;
    fileBuffer: string;
}

type StylesLibrary = {
    [key in ConsoleLineType]: StyleConfig | null;
};
type StyleConfig = {
    web: StyleChannelConfig;
    stdout: StyleChannelConfig | false;
}
type StyleChannelConfig = {
    prefix?: ChalkInstance;
    line?: ChalkInstance;
}


//Precalculating some styles
const chalkToStr = (color: ChalkInstance) => color('\x00').split('\x00')[0];
const precalcMarkerAdminCmd = chalkToStr(chalk.bgHex('#e6b863').black);
const precalcMarkerSystemCmd = chalkToStr(chalk.bgHex('#36383D').hex('#CCCCCC'));
const precalcMarkerInfo = chalkToStr(chalk.bgBlueBright.black);
const ANSI_RESET = '\x1B[0m';
const ANSI_ERASE_LINE = '\x1b[K';

const STYLES = {
    [ConsoleLineType.StdOut]: null, //fully shortcircuited
    [ConsoleLineType.StdErr]: {
        web: {
            prefix: chalk.bgRedBright.bold.black,
            line: chalk.bold.redBright,
        },
        stdout: {
            prefix: chalk.bgRedBright.bold.black,
            line: chalk.bold.redBright,
        },
    },
    [ConsoleLineType.MarkerAdminCmd]: {
        web: {
            prefix: chalk.bold,
            line: x => `${precalcMarkerAdminCmd}${x}${ANSI_ERASE_LINE}${ANSI_RESET}`,
        },
        stdout: false,
    },
    [ConsoleLineType.MarkerSystemCmd]: {
        web: {
            prefix: chalk.bold,
            line: x => `${precalcMarkerSystemCmd}${x}${ANSI_ERASE_LINE}${ANSI_RESET}`,
        },
        stdout: false,
    },
    [ConsoleLineType.MarkerInfo]: {
        web: {
            prefix: chalk.bold,
            line: x => `${precalcMarkerInfo}${x}${ANSI_ERASE_LINE}${ANSI_RESET}`,
        },
        stdout: {
            prefix: chalk.bgBlueBright.bold.black,
            line: chalk.bgBlueBright.bold.black,
        },
    },
} as StylesLibrary;



const getConsoleLinePrefix = (prefix: string) => `[${prefix.padStart(20, ' ')}]`;
export const FORCED_EOL = '\u21A9\n'; //used in test file only

//NOTE: the \n must come _after_ the color so LiveConsolePage.tsx can know when it's an incomplete line
const colorLines = (str: string, color: ChalkInstance | undefined) => {
    if (!color) return str;
    const stripped = stripLastEol(str);
    return color(stripped.str) + stripped.eol;
};


/**
 * Handles fxserver stdio and turns it into a cohesive textual output
 */
export default class ConsoleTransformer {
    public lastEol = true;
    private lastSrc = '0:undefined';
    private lastMarkerTs = 0; //in seconds
    private STYLES = STYLES;
    private PREFIX_SYSTEM = getConsoleLinePrefix('TXADMIN');
    private PREFIX_STDERR = getConsoleLinePrefix('STDERR');

    constructor() { }

    public process(type: ConsoleLineType, data: string, context?: string): MultiBuffer {
        //Shortcircuiting for empty strings
        if (!data.length) return { webBuffer: '', stdoutBuffer: '', fileBuffer: '' };
        const src = `${type}:${context}`;
        if (data === '\n' || data === '\r\n') {
            this.lastEol = true;
            this.lastSrc = src;
            return { webBuffer: '\n', stdoutBuffer: '\n', fileBuffer: '\n' };
        }
        let webBuffer = '';
        let stdoutBuffer = '';
        let fileBuffer = '';

        //incomplete
        if (!this.lastEol) {
            //diff source
            if (src !== this.lastSrc) {
                webBuffer += FORCED_EOL;
                stdoutBuffer += FORCED_EOL;
                fileBuffer += FORCED_EOL;
                const prefixed = this.prefixChunk(type, data, context);
                webBuffer += this.getTimeMarker() + prefixed.webBuffer;
                stdoutBuffer += prefixed.stdoutBuffer;
                fileBuffer += prefixed.fileBuffer;
                this.lastEol = data[data.length - 1] === '\n';
                this.lastSrc = src;
                return { webBuffer, stdoutBuffer, fileBuffer };
            }
            //same source
            const parts = splitFirstLine(data);
            fileBuffer += parts.first;
            const style = this.STYLES[type];
            if (style === null) {
                webBuffer += parts.first;
                stdoutBuffer += parts.first;
            } else {
                webBuffer += colorLines(
                    parts.first,
                    style.web.line,
                );
                stdoutBuffer += style.stdout ? colorLines(
                    parts.first,
                    style.stdout.line,
                ) : '';
            }
            if (parts.rest) {
                const prefixed = this.prefixChunk(type, parts.rest, context);
                webBuffer += this.getTimeMarker() + prefixed.webBuffer;
                stdoutBuffer += prefixed.stdoutBuffer;
                fileBuffer += prefixed.fileBuffer;
            }
            this.lastEol = parts.eol;
            return { webBuffer, stdoutBuffer, fileBuffer };
        }

        //complete
        const prefixed = this.prefixChunk(type, data, context);
        webBuffer += this.getTimeMarker() + prefixed.webBuffer;
        stdoutBuffer += prefixed.stdoutBuffer;
        fileBuffer += prefixed.fileBuffer;
        this.lastEol = data[data.length - 1] === '\n';
        this.lastSrc = src;

        return { webBuffer, stdoutBuffer, fileBuffer };
    }

    private getTimeMarker() {
        const currMarkerTs = Math.floor(Date.now() / 1000);
        if (currMarkerTs !== this.lastMarkerTs) {
            this.lastMarkerTs = currMarkerTs;
            return `{§${currMarkerTs.toString(16)}}`
        }
        return '';
    }

    private prefixChunk(type: ConsoleLineType, chunk: string, context?: string): MultiBuffer {
        //NOTE: as long as stdout is shortcircuited, the other ones don't need to be micro-optimized
        const style = this.STYLES[type];
        if (style === null) {
            return {
                webBuffer: chunk,
                stdoutBuffer: chunk,
                fileBuffer: chunk,
            };
        }

        //selecting prefix and color
        let prefix = '';
        if (type === ConsoleLineType.StdErr) {
            prefix = this.PREFIX_STDERR;
        } else if (type === ConsoleLineType.MarkerAdminCmd) {
            prefix = getConsoleLinePrefix(context ?? '?');
        } else if (type === ConsoleLineType.MarkerSystemCmd) {
            prefix = this.PREFIX_SYSTEM;
        } else if (type === ConsoleLineType.MarkerInfo) {
            prefix = this.PREFIX_SYSTEM;
        }

        const webPrefix = style.web.prefix ? style.web.prefix(prefix) : prefix;
        const webBuffer = colorLines(
            prefixMultiline(chunk, webPrefix + ' '),
            style.web.line,
        );

        let stdoutBuffer = '';
        if (style.stdout) {
            const stdoutPrefix = style.stdout.prefix ? style.stdout.prefix(prefix) : prefix;
            stdoutBuffer = colorLines(
                prefixMultiline(chunk, stdoutPrefix + ' '),
                style.stdout.line,
            );
        }
        const fileBuffer = prefixMultiline(chunk, prefix + ' ');

        return { webBuffer, stdoutBuffer, fileBuffer };
    }
};
