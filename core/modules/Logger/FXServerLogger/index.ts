const modulename = 'Logger:FXServer';
import bytes from 'bytes';
import type { Options as RfsOptions } from 'rotating-file-stream';
import { getLogDivider } from '../loggerUtils.js';
import consoleFactory, { processStdioWriteRaw } from '@lib/console.js';
import { LoggerBase } from '../LoggerBase.js';
import ConsoleTransformer from './ConsoleTransformer.js';
import ConsoleLineEnum from './ConsoleLineEnum.js';
import { FrameChunkAssembler } from './fxsFrameUtils.js';
import { FRAME_FXS_CODE, FXS_CHANNEL_WIDTH_GEN8, FXS_CHANNEL_WIDTH_GEN9 } from '@shared/consoleFrames';
import { txEnv, txHostConfig } from '@core/globalData.js';
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
//Same as above, but letting through \x1E (record separator) and \x1F (unit separator),
//which are used by the fxserver output framing. \x1D is still stripped, as it is reserved for txAdmin.
const regexControlsFramed = /[\x00-\x08\x0B-\x1A\x1C\x1D\x7F]|(?:\x1B\[|\x9B)[\d;]+[@-K]/g;
const regexColors = /\x1B[^m]*?m/g;


export default class FXServerLogger extends LoggerBase {
    private readonly transformer = new ConsoleTransformer({
        channelWidth: txEnv.fxsIsGen9 ? FXS_CHANNEL_WIDTH_GEN9 : FXS_CHANNEL_WIDTH_GEN8,
    });
    private readonly frameAssembler = new FrameChunkAssembler();
    private fileBuffer = '';
    private recentBuffer = '';
    private readonly recentBufferMaxSize = 256 * 1024; //kb
    private readonly recentBufferTrimSliceSize = 32 * 1024; //how much will be cut when overflows

    constructor(basePath: string, lrProfileConfig: RfsOptions | false) {
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

        setInterval(() => {
            this.flushFileBuffer();
        }, 5000);
    }


    /**
     * Returns a string with short usage stats
     */
    getUsageStats() {
        return {
            buffer: bytes(this.recentBuffer.length)!,
            lrErrors: this.lrErrors,
        };
    }


    /**
     * Returns the recent fxserver buffer containing HTML markers, and not XSS escaped.
     * The size of this buffer is usually above 64kb, never above 128kb.
     */
    getRecentBuffer() {
        return this.recentBuffer;
    }


    /**
     * Strips color of the file buffer and flushes it.
     * FIXME: this will still allow colors to be written to the file if the buffer cuts 
     * in the middle of a color sequence, but less often since we are buffering more data.
     */
    flushFileBuffer() {
        this.lrStream.write(this.fileBuffer.replace(regexColors, ''));
        this.fileBuffer = '';
    }


    /**
     * Receives the assembled console blocks, stringifies, marks, colors them and dispatches it to
     * lrStream, websocket, and process stdout.
     */
    private ingest(type: ConsoleLineEnum, data: string, context?: string) {
        //Process the data
        const { webBuffer, stdoutBuffer, fileBuffer } = this.transformer.process(type, data, context);

        //To file
        this.fileBuffer += fileBuffer;

        //For the terminal
        if (!txConfig.server.quiet && !txHostConfig.forceQuietMode) {
            processStdioWriteRaw(stdoutBuffer);
        }

        //For the live console
        txCore.webServer.webSocket.buffer('liveconsole', webBuffer);
        this.appendRecent(webBuffer);
    }


    /**
     * Writes to the log an informational message
     */
    public logInformational(msg: string) {
        this.ingest(ConsoleLineEnum.MarkerInfo, msg + '\n');
    }


    /**
     * Writes to the log that the server is booting
     */
    public logFxserverSpawn(pid: string) {
        //Resetting the output framing detection for the new process
        this.transformer.resetFraming();
        this.frameAssembler.reset();

        //force line skip to create separation
        if (this.recentBuffer.length) {
            const lineBreak = this.transformer.lastEol ? '\n' : '\n\n';
            this.ingest(ConsoleLineEnum.MarkerInfo, lineBreak);
        }
        //need to break line
        const multiline = getLogDivider(`[${pid}] FXServer Starting`);
        for (const line of multiline.split('\n')) {
            if (!line.length) break;
            this.ingest(ConsoleLineEnum.MarkerInfo, line + '\n');
        }
    }


    /**
     * Writes to the log an admin command
     */
    public logAdminCommand(author: string, cmd: string) {
        this.ingest(ConsoleLineEnum.MarkerAdminCmd, cmd + '\n', author);
    }


    /**
     * Writes to the log a system command.
     */
    public logSystemCommand(cmd: string) {
        if(cmd.startsWith('txaEvent "consoleCommand"')) return;
        // if (/^txaEvent \w+ /.test(cmd)) {
        //     const [event, payload] = cmd.substring(9).split(' ', 2);
        //     cmd = chalk.italic(`<broadcasting txAdmin:events:${event}>`);
        // }
        this.ingest(ConsoleLineEnum.MarkerSystemCmd, cmd + '\n');
    }


    /**
     * Handles all stdio data.
     * Output framing (gen9) is detected by the first stdout chunk starting with \x1E, and once
     * detected it stays on until the next spawn. Stderr always goes through the legacy path.
     */
    public writeFxsOutput(
        source: ConsoleLineEnum.StdOut | ConsoleLineEnum.StdErr,
        data: string | Buffer
    ) {
        if (typeof data !== 'string') {
            data = data.toString();
        }

        //Legacy path (gen8, stderr, or framing not detected)
        if (source !== ConsoleLineEnum.StdOut) {
            return this.ingest(source, data.replace(regexControls, ''));
        }
        if (!this.transformer.isFramed) {
            if (data.charCodeAt(0) !== FRAME_FXS_CODE) {
                return this.ingest(source, data.replace(regexControls, ''));
            }
            this.transformer.isFramed = true;
        }

        //Framed path: strip controls (but not the frame separators), then hold back
        //any partial header at the end of the chunk so it can be completed by the next one
        const chunk = this.frameAssembler.feed(data.replace(regexControlsFramed, ''));
        if (chunk.length) {
            this.ingest(source, chunk);
        }
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
