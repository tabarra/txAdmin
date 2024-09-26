const modulename = 'Logger:FXServer';
import bytes from 'bytes';
import chalk, { ChalkInstance } from 'chalk';
import rfs from 'rotating-file-stream';
import { getLogDivider } from '../loggerUtils.js';
import consoleFactory from '@extras/console';
import { LoggerBase } from '../LoggerBase.js';
import TxAdmin from '@core/txAdmin.js';
import ConsoleStreamAssembler, { FlushQueueBlockType } from './ConsoleStreamAssembler.js';
import styleLineParts from './styleLineParts.js';
const console = consoleFactory(modulename);


//This regex was done in the first place to prevent fxserver output to be interpreted as txAdmin output by the host terminal
//IIRC the issue was that one user with a TM on their nick was making txAdmin's console to close or freeze. I couldn't reproduce the issue.
// \x00-\x08 Control characters in the ASCII table.
// allow \r and \t
// \x0B-\x1A Vertical tab and control characters from shift out to substitute.
// allow \x1B (escape for colors n stuff)
// \x1C-\x1F Control characters (file separator, group separator, record separator, unit separator).
// allow all printable
// \x7F Delete character.
const regexControls = /[\x00-\x08\x0B-\x1A\x1C-\x1F\x7F]|(?:\x1B\[|\x9B)[\d;]+[@-K]/g;
const regexColors = /\x1B[^m]*?m/g;

//To break any fake marker - using only one char because multichar can be broken by processQueue
const SECT_ZWNBSP = '§\uFEFF';


export enum FxsConsoleMessageType {
    StdOut,
    StdErr,
    MarkerAdminCmd,
    MarkerSystemCmd,
    MarkerInfo,
}

// const markLines = (type: FxsConsoleMessageType, msg: string, prefix?: string) => {
//     // let prefixColor: ChalkInstance;
//     let lineColor: ChalkInstance;
//     if (type === FxsConsoleMessageType.StdErr) {
//         lineColor = chalk.bgRedBright.bold.black;
//         if (prefix) {
//             // prefix = chalk.inverse(prefix);
//             prefix = lineColor(prefix);
//         }
//     } else if (type === FxsConsoleMessageType.MarkerAdminCmd) {
//         lineColor = chalk.bgYellowBright.bold.black;
//     } else if (type === FxsConsoleMessageType.MarkerSystemCmd) {
//         prefix = consoleSystemPrefix;
//         //FIXME:
//         lineColor = chalk.bgHex('#36383D').hex('#CCCCCC');
//         // prefixColor = chalk.bgHex('#FF00DC').bold;
//         if (prefix) {
//             // prefix = chalk.inverse(prefix);
//             prefix = chalk.bgHex('#FF00DC').bold(prefix);
//         }
//     } else if (type === FxsConsoleMessageType.MarkerInfo) {
//         lineColor = chalk.bgBlueBright.bold.black;
//     } else {
//         // prefixColor = chalk.reset;
//         lineColor = chalk.reset;
//     }
//     const finalEol = msg.endsWith('\n') ? '\n' : '';
//     if (prefix) {
//         return lineColor(msg.trim()).replace(/\n/g, `\n${prefix}`) + finalEol;
//     } else {
//         return lineColor(msg.trim()) + finalEol;
//     }
//     // if (prefix) {
//     //     msg = prefix + msg.trim().replace(/\n/g, `\n${prefix}`) + finalEol;
//     // }
//     // return lineColor(msg.trim()) + finalEol;
// };


export default class FXServerLogger extends LoggerBase {
    private readonly txAdmin: TxAdmin;
    private readonly assembler = new ConsoleStreamAssembler(this.flushCallback.bind(this));
    private recentBuffer = '';
    private readonly recentBufferMaxSize = 256 * 1024; //kb
    private readonly recentBufferTrimSliceSize = 32 * 1024; //how much will be cut when overflows

    constructor(txAdmin: TxAdmin, basePath: string, lrProfileConfig: rfs.Options) {
        const lrDefaultOptions = {
            path: basePath,
            intervalBoundary: true,
            initialRotation: true,
            history: 'fxserver.history',
            // compress: 'gzip',
            interval: '1d',
            maxFiles: 7,
            maxSize: '5G',
        };
        super(basePath, 'fxserver', lrDefaultOptions, lrProfileConfig);
        this.txAdmin = txAdmin;
    }


    /**
     * Returns a string with short usage stats
     */
    getUsageStats() {
        return `Buffer: ${bytes(this.recentBuffer.length)}, lrErrors: ${this.lrErrors}`;
    }


    /**
     * Returns the recent fxserver buffer containing HTML markers, and not XSS escaped.
     * The size of this buffer is usually above 64kb, never above 128kb.
     */
    getRecentBuffer() {
        return this.recentBuffer;
    }


    /**
     * Receives the assembled console blocks, stringifies, marks, colors them and dispatches it to
     * lrStream, websocket, and process stdout.
     */
    private flushCallback(parts: FlushQueueBlockType[]) {
        let webBuffer = '';
        let stdoutBuffer = '';
        let fileBuffer = '';
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (part.ts) {
                webBuffer += `{§${part.ts.toString(16)}}`;
            }
            part.data = part.data.replaceAll('§', SECT_ZWNBSP);
            const styled = styleLineParts(part);
            webBuffer += styled.web;
            stdoutBuffer += styled.stdout;
            fileBuffer += styled.file;

            // console.dir({
            //     line: tsSectEscapedData,
            // });
            // if (part.src === FxsConsoleMessageType.StdOut) {
            //     consoleBuffer += tsSectEscapedData;
            // } else if (part.src === FxsConsoleMessageType.StdErr) {
            //     // consoleBuffer += tsSectEscapedData;
            //     const prefix = part.noPrefix ? '' : consoleStderrPrefix;
            //     consoleBuffer += markLines(FxsConsoleMessageType.StdErr, tsSectEscapedData, prefix);
            //     // console.dir({
            //     //     ____og: tsSectEscapedData,
            //     //     marked: markLines(FxsConsoleMessageType.StdErr, tsSectEscapedData, prefix),
            //     // });
            // } else {
            //     // console.dir({
            //     //     ____og: tsSectEscapedData,
            //     //     marked: markLines(FxsConsoleMessageType.StdErr, tsSectEscapedData, consoleStderrPrefix),
            //     // });
            //     consoleBuffer += markLines(part.src, tsSectEscapedData);
            // }
        }
        fileBuffer = fileBuffer.replace(regexControls, '').replace(regexColors, '');
        webBuffer = webBuffer.replace(regexControls, '');

        //To file
        //FIXME: this replacer should be on an async function, preferably buffered
        this.lrStream.write(fileBuffer);

        //For the terminal
        if (!this.txAdmin.fxRunner.config.quiet) {
            process.stdout.write(consoleBuffer);
        }

        //For the live console
        //FIXME: ao invés de re-bufferizar, já dar um flush no websocket
        this.txAdmin.webServer.webSocket.buffer('liveconsole', webBuffer);
        this.appendRecent(webBuffer);
    }


    /**
     * Writes to the log that the server is booting
     */
    public logFxserverBoot(mutex: string, pid: string) {
        //FIXME: add mutex & pid?
        const msg = getLogDivider('FXServer Starting');
        this.assembler.push(FxsConsoleMessageType.MarkerInfo, msg);
    }


    /**
     * Writes to the log an admin command
     */
    public logAdminCommand(author: string, cmd: string) {
        this.assembler.push(FxsConsoleMessageType.MarkerAdminCmd, `${cmd}\n`, author);
    }


    /**
     * Writes to the log a system command
     */
    public logSystemCommand(cmd: string) {
        this.assembler.push(FxsConsoleMessageType.MarkerSystemCmd, `${cmd}\n`);
    }


    /**
     * Handles all stdio data.
     */
    public writeFxsOutput(
        source: FxsConsoleMessageType.StdOut | FxsConsoleMessageType.StdErr,
        data: string | Buffer
    ) {
        if (typeof data !== 'string') {
            data = data.toString();
        }
        this.assembler.push(source, data);
    }


    /**
     * Appends data to the recent buffer and recycles it when necessary
     */
    private appendRecent(data: string) {
        this.recentBuffer += data;
        if (this.recentBuffer.length > this.recentBufferMaxSize) {
            this.recentBuffer = this.recentBuffer.slice(this.recentBufferTrimSliceSize - this.recentBufferMaxSize);
            this.recentBuffer = this.recentBuffer.substring(this.recentBuffer.indexOf('\n'));
            //FIXME: precisa encontrar o próximo tsMarker ao invés de \n
            //usar String.prototype.search() com regex

            //FIXME: salvar em 8 blocos de 32kb
            // quando atingir 32, quebrar no primeiro tsMarker
        }
    }
};
