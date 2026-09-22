import ConsoleLineEnum from './ConsoleLineEnum';
import { prefixMultiline, splitFirstLine, stripLastEol } from './fxsLoggerUtils';
import { FramedChunkProcessor } from './fxsFrameUtils';
import {
    buildTxFrameHeader,
    encodeFrameTs,
    FRAME_CONTEXT_MAX_LENGTH,
    FXS_CHANNEL_WIDTH_GEN8,
    TxLineKind,
    type TxLineKindChar,
} from '@shared/consoleFrames';
import chalk, { ChalkInstance } from 'chalk';


//Types
export type MultiBuffer = {
    webBuffer: string;
    stdoutBuffer: string;
    fileBuffer: string;
}

type StylesLibrary = {
    [key in ConsoleLineEnum]: StyleConfig | null;
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
const precalcMarkerAdminCmd = chalkToStr(chalk.bgAnsi256(180).black);
const precalcMarkerSystemCmd = chalkToStr(chalk.bgAnsi256(237).ansi256(252));
const precalcMarkerInfo = chalkToStr(chalk.bgBlueBright.black);
const ANSI_RESET = '\x1B[0m';
const ANSI_ERASE_LINE = '\x1b[K';

const STYLES = {
    [ConsoleLineEnum.StdOut]: null, //no styling, web gets a header only
    [ConsoleLineEnum.StdErr]: {
        web: {
            prefix: chalk.bgRedBright.bold.black,
            line: chalk.bold.redBright,
        },
        stdout: {
            prefix: chalk.bgRedBright.bold.black,
            line: chalk.bold.redBright,
        },
    },
    [ConsoleLineEnum.MarkerAdminCmd]: {
        web: {
            prefix: chalk.bold,
            line: x => `${precalcMarkerAdminCmd}${x}${ANSI_ERASE_LINE}${ANSI_RESET}`,
        },
        stdout: false,
    },
    [ConsoleLineEnum.MarkerSystemCmd]: {
        web: {
            prefix: chalk.bold,
            line: x => `${precalcMarkerSystemCmd}${x}${ANSI_ERASE_LINE}${ANSI_RESET}`,
        },
        stdout: false,
    },
    [ConsoleLineEnum.MarkerInfo]: {
        web: {
            prefix: chalk.bold,
            line: x => `${precalcMarkerInfo}${x}${ANSI_ERASE_LINE}${ANSI_RESET}`,
        },
        stdout: {
            prefix: chalk.bgBlueBright.black,
            line: chalk.bgBlueBright.black,
        },
    },
} as StylesLibrary;

const TX_KIND_BY_TYPE: Record<ConsoleLineEnum, TxLineKindChar> = {
    [ConsoleLineEnum.StdOut]: TxLineKind.LegacyStdOut,
    [ConsoleLineEnum.StdErr]: TxLineKind.StdErr,
    [ConsoleLineEnum.MarkerAdminCmd]: TxLineKind.AdminCmd,
    [ConsoleLineEnum.MarkerSystemCmd]: TxLineKind.SystemCmd,
    [ConsoleLineEnum.MarkerInfo]: TxLineKind.Info,
};

export const FORCED_EOL = '↩\n'; //used in test file only
const EMPTY_BUFFER: MultiBuffer = { webBuffer: '', stdoutBuffer: '', fileBuffer: '' };
const regexContextControls = /[\x00-\x1F\x7F]/g;

//NOTE: [jan/2025] Changed from [] to make it easier to find tx stdin in the log files
const prefixChar = '║' //Alternatives: | & ┇
const getConsoleLinePrefix = (prefix: string, width: number) => prefixChar + prefix.padStart(width, ' ') + prefixChar;

export type ConsoleTransformerOptions = {
    //Width of the channel column, must match the fxserver generation so the prefixes align
    channelWidth?: number;
}

//NOTE: the \n must come _after_ the color so LiveConsolePage.tsx can know when it's an incomplete line
const colorLines = (str: string, color: ChalkInstance | undefined) => {
    if (!color) return str;
    const stripped = stripLastEol(str);
    return color(stripped.str) + stripped.eol;
};


/**
 * Handles fxserver stdio and turns it into a cohesive textual output.
 * Every line sent to the web gets a header, see shared/consoleFrames.ts for the protocol.
 */
export default class ConsoleTransformer {
    public lastEol = true;
    public isFramed = false; //set by the logger when fxserver output framing is detected
    private lastSrc = '0:undefined';
    private lastTs = 0; //in seconds
    private tsHex = encodeFrameTs(0);
    private legacyStdOutHeader = buildTxFrameHeader(this.tsHex, TxLineKind.LegacyStdOut);
    private STYLES = STYLES;
    private readonly channelWidth: number;
    private PREFIX_SYSTEM: string;
    private PREFIX_STDERR: string;
    private readonly framedProcessor = new FramedChunkProcessor();

    constructor(options: ConsoleTransformerOptions = {}) {
        this.channelWidth = options.channelWidth ?? FXS_CHANNEL_WIDTH_GEN8;
        this.PREFIX_SYSTEM = getConsoleLinePrefix('TXADMIN', this.channelWidth);
        this.PREFIX_STDERR = getConsoleLinePrefix('STDERR', this.channelWidth);
    }

    public process(type: ConsoleLineEnum, data: string, context?: string): MultiBuffer {
        //Shortcircuiting for empty strings
        if (!data.length) return EMPTY_BUFFER;
        const src = `${type}:${context}`;
        if (data === '\n' || data === '\r\n') {
            this.lastEol = true;
            this.lastSrc = src;
            return { webBuffer: '\n', stdoutBuffer: '\n', fileBuffer: '\n' };
        }
        this.refreshTs();
        let webBuffer = '';
        let stdoutBuffer = '';
        let fileBuffer = '';

        //Framed stdout: every record carries its own header, continuation lines have no \x1e,
        //so the whole chunk can be processed uniformly regardless of lastEol
        if (type === ConsoleLineEnum.StdOut && this.isFramed) {
            if (!this.lastEol && src !== this.lastSrc) {
                webBuffer = FORCED_EOL;
                stdoutBuffer = FORCED_EOL;
                fileBuffer = FORCED_EOL;
            }
            const processed = this.framedProcessor.process(data, this.tsHex);
            webBuffer += processed.web;
            stdoutBuffer += processed.stdout;
            fileBuffer += processed.stdout;
            this.lastEol = data[data.length - 1] === '\n';
            this.lastSrc = src;
            return { webBuffer, stdoutBuffer, fileBuffer };
        }

        //incomplete
        if (!this.lastEol) {
            //diff source
            if (src !== this.lastSrc) {
                webBuffer += FORCED_EOL;
                stdoutBuffer += FORCED_EOL;
                fileBuffer += FORCED_EOL;
                const prefixed = this.prefixChunk(type, data, context);
                webBuffer += prefixed.webBuffer;
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
                webBuffer += prefixed.webBuffer;
                stdoutBuffer += prefixed.stdoutBuffer;
                fileBuffer += prefixed.fileBuffer;
            }
            this.lastEol = parts.eol;
            return { webBuffer, stdoutBuffer, fileBuffer };
        }

        //complete
        const prefixed = this.prefixChunk(type, data, context);
        webBuffer += prefixed.webBuffer;
        stdoutBuffer += prefixed.stdoutBuffer;
        fileBuffer += prefixed.fileBuffer;
        this.lastEol = data[data.length - 1] === '\n';
        this.lastSrc = src;

        return { webBuffer, stdoutBuffer, fileBuffer };
    }

    /**
     * Resets the state that depends on the fxserver process (call on spawn).
     */
    public resetFraming() {
        this.isFramed = false;
        this.framedProcessor.reset();
    }

    /**
     * Updates the cached timestamp strings, at most once per second.
     */
    private refreshTs() {
        const currTs = Math.floor(Date.now() / 1000);
        if (currTs !== this.lastTs) {
            this.lastTs = currTs;
            this.tsHex = encodeFrameTs(currTs);
            this.legacyStdOutHeader = buildTxFrameHeader(this.tsHex, TxLineKind.LegacyStdOut);
        }
    }

    /**
     * Returns the txAdmin line header for the given type.
     */
    private getTxHeader(type: ConsoleLineEnum, context?: string) {
        if (type === ConsoleLineEnum.StdOut) return this.legacyStdOutHeader;
        const kind = TX_KIND_BY_TYPE[type];
        const cleanContext = (type === ConsoleLineEnum.MarkerAdminCmd && context)
            ? context.replace(regexContextControls, '').slice(0, FRAME_CONTEXT_MAX_LENGTH)
            : '';
        return buildTxFrameHeader(this.tsHex, kind, cleanContext);
    }

    private prefixChunk(type: ConsoleLineEnum, chunk: string, context?: string): MultiBuffer {
        const header = this.getTxHeader(type, context);

        //Legacy stdout: header on the web only, stdout/file get the raw chunk
        const style = this.STYLES[type];
        if (style === null) {
            return {
                webBuffer: prefixMultiline(chunk, header),
                stdoutBuffer: chunk,
                fileBuffer: chunk,
            };
        }

        //selecting prefix and color
        let prefix = '';
        if (type === ConsoleLineEnum.StdErr) {
            prefix = this.PREFIX_STDERR;
        } else if (type === ConsoleLineEnum.MarkerAdminCmd) {
            prefix = getConsoleLinePrefix(context ?? '?', this.channelWidth);
        } else if (type === ConsoleLineEnum.MarkerSystemCmd) {
            prefix = this.PREFIX_SYSTEM;
        } else if (type === ConsoleLineEnum.MarkerInfo) {
            prefix = this.PREFIX_SYSTEM;
        }

        //NOTE: the header must be the first thing in each line, so it's applied after coloring
        const webPrefix = style.web.prefix ? style.web.prefix(prefix) : prefix;
        const webBuffer = prefixMultiline(
            colorLines(
                prefixMultiline(chunk, webPrefix + ' '),
                style.web.line,
            ),
            header,
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
