import { prefixMultiline, splitFirstLine } from './fxsLoggerUtils';
import { ConsoleLineType } from './index';
import chalk from 'chalk';



//Types
export type MultiBuffer = {
    webBuffer: string;
    stdoutBuffer: string;
    fileBuffer: string;
}

type ColorLibrary = {
    [key in ConsoleLineType]: (str: string) => string;
}
const WEB_COLORS = {
    [ConsoleLineType.StdOut]: (str) => str,
    [ConsoleLineType.StdErr]: chalk.bgRedBright.bold.black,
    [ConsoleLineType.MarkerAdminCmd]: chalk.bgYellowBright.bold.black,
    [ConsoleLineType.MarkerSystemCmd]: chalk.bgHex('#36383D').bold.hex('#CCCCCC'),
    [ConsoleLineType.MarkerInfo]: chalk.bgBlueBright.bold.black,
} as ColorLibrary;
const STDOUT_COLORS = {
    [ConsoleLineType.StdOut]: (str) => str,
    [ConsoleLineType.StdErr]: chalk.bgRedBright.bold.black,
    [ConsoleLineType.MarkerAdminCmd]: chalk.bgYellowBright.bold.black,
    [ConsoleLineType.MarkerSystemCmd]: chalk.bgHex('#36383D').bold.hex('#CCCCCC'),
    [ConsoleLineType.MarkerInfo]: chalk.bgBlueBright.bold.black,
} as ColorLibrary;

const getConsoleLinePrefix = (prefix: string) => `[${prefix.padStart(20, ' ')}] `;
export const FORCED_EOL = '\u21A9\n'; //used in test file only


/**
 * Handles fxserver stdio and turns it into a cohesive textual output
 */
export default class ConsoleTransformer {
    private lastMarkerTs = 0; //in seconds
    private lastEol = true;
    private lastSrc = '0:undefined';
    private WEB_PREFIX_COLOR = WEB_COLORS;
    private WEB_LINE_COLOR = WEB_COLORS;
    private STDOUT_PREFIX_COLOR = STDOUT_COLORS;
    private STDOUT_LINE_COLOR = STDOUT_COLORS;
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
            webBuffer += this.WEB_LINE_COLOR[type](parts.first);
            stdoutBuffer += this.STDOUT_LINE_COLOR[type](parts.first);
            fileBuffer += parts.first;
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

    //NOTE: since only StdOut is spammed, efficiency of the other ones isn't crucial
    private prefixChunk(type: ConsoleLineType, chunk: string, context?: string): MultiBuffer {
        if (type === ConsoleLineType.StdOut) {
            return { webBuffer: chunk, stdoutBuffer: chunk, fileBuffer: chunk };
        }
        
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
        let webBuffer = this.WEB_LINE_COLOR[type](
            prefixMultiline(chunk, this.WEB_PREFIX_COLOR[type](prefix))
        );
        let stdoutBuffer = this.STDOUT_LINE_COLOR[type](
            prefixMultiline(chunk, this.STDOUT_PREFIX_COLOR[type](prefix))
        );
        let fileBuffer = prefixMultiline(chunk, prefix);

        return { webBuffer, stdoutBuffer, fileBuffer };
    }
};
