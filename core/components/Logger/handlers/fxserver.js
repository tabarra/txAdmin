const modulename = 'Logger:FXServer';
import bytes from 'bytes';
import chalk from 'chalk';
import { LoggerBase, separator } from '../loggerUtils.js';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);


//NOTE: There used to be a rule "\x0B-\x1F" that was replaced with "x0B-\x1A\x1C-\x1F" to allow the \x1B terminal escape character.
//NOTE: There used to be a rule for the TM symbol (\u2122), but removed because probably not needed
//NOTE: There used to be a rule "\x7F-\x9F", but removed (except \x7F) because probably not needed
//This is neccessary for the terminal to have color, but beware of side effects.
//This regex was done in the first place to prevent fxserver output to be interpreted as txAdmin output by the host terminal
//IIRC the issue was that one user with a TM on their nick was making txAdmin's console to close or freeze. I couldn't reproduce the issue.
// \x00-\x08 Control characters in the ASCII table.
// allow \r and \t
// \x0B-\x1A Vertical tab and control characters from shift out to substitute.
// allow \x1B (escape for colors n stuff)
// \x1C-\x1F Control characters (file separator, group separator, record separator, unit separator).
// allow all printable
// \x7F Delete character.
const regexConsole = /[\x00-\x08\x0B-\x1A\x1C-\x1F\x7F\x80-\x9F]/g;
const regexCsi = /(\u001b\[|\u009B)[\d;]+[@-K]/g;
const regexColors = /\u001b[^m]*?m/g;

const markLines = (msg, type, prefix = '') => {
    let colorFunc = (x) => x;
    if (type === 'cmd') {
        colorFunc = chalk.bgYellowBright.bold.black;
    } else if (type === 'error') {
        colorFunc = chalk.bgRedBright.bold.black;
    } else if (type === 'info') {
        colorFunc = chalk.bgBlueBright.bold.black;
    } else if (type === 'ok') {
        colorFunc = chalk.bgGreenBright.bold.black;
    }
    const paddedPrefix = prefix.padStart(20, ' ');
    const taggedPrefix = prefix ? `[${paddedPrefix}] ` : ' ';
    return msg.trim()
        .split('\n')
        .map((l) => colorFunc(`${taggedPrefix}${l}`))
        .join('\n') + '\n';
};


export default class FXServerLogger extends LoggerBase {
    constructor(basePath, lrProfileConfig) {
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
        this.lrStream.on('rotated', (filename) => {
            this.lrStream.write(`\n${separator('Log Rotated')}\n`);
            console.verbose.log(`Rotated file ${filename}`);
        });

        this.recentBuffer = '';
        this.recentBufferMaxSize = 256 * 1024; //kb
        this.recentBufferTrimSliceSize = 32 * 1024; //how much will be cut when overflows
    }


    /**
     * Returns a string with short usage stats
     */
    getUsageStats() {
        return `Buffer: ${bytes(this.recentBuffer.length)}, lrErrors: ${this.lrErrors}`;
    }


    /***
     * Returns the recent fxserver buffer containing HTML markers, and not XSS escaped.
     * The size of this buffer is usually above 64kb, never above 128kb.
     */
    getRecentBuffer() {
        return this.recentBuffer;
    }


    /**
     * Writes a marker text to the logger (file, websocket, buffer, stdout)
     * @param {String} type
     * @param {String} data
     * @param {String} src
     */
    writeMarker(type, data, src) {
        if (type === 'starting') {
            const msg = separator('FXServer Starting');
            this.lrStream.write(`\n${msg}\n`);
            if (!globals.fxRunner.config.quiet) {
                process.stdout.write(`\n${chalk.bgBlue(msg)}\n`);
            }
            const coloredMarkData = `\n\n${markLines(msg, 'info', 'TXADMIN')}\n`;
            globals.webServer.webSocket.buffer('liveconsole', coloredMarkData);
            this.appendRecent(coloredMarkData);
        } else if (type === 'command') {
            this.lrStream.write(`> ${data}\n`);
            const coloredMarkData = markLines(data, 'cmd', src);
            globals.webServer.webSocket.buffer('liveconsole', coloredMarkData);
            this.appendRecent(coloredMarkData);
        } else {
            throw new Error('Unknown write type');
        }
    }


    /**
     * Handles all stdio data.
     * NOTE: XSS is NOT handled here, the frontend is responsible for it!
     *
     * @param {String} type
     * @param {String} data
     */
    writeStdIO(type, data) {
        //To file
        this.lrStream.write(data.replace(regexColors, ''));

        //Removing console-breaking chars
        const consoleData = data
            .replace(regexConsole, '')
            .replace(regexCsi, '');

        //For the terminal
        if (!globals.fxRunner.config.quiet) {
            const coloredAnsiData = (type === 'stdout') ? consoleData : chalk.redBright(consoleData);
            process.stdout.write(coloredAnsiData);
        }

        //For the live console
        const coloredMarkData = (type === 'stdout') ? consoleData : markLines(consoleData, 'error', 'STDERR');
        globals.webServer.webSocket.buffer('liveconsole', coloredMarkData);
        this.appendRecent(coloredMarkData);
    }


    /**
     * Appends data to the recent buffer and recycles it when necessary
     * @param {String} data
     */
    appendRecent(data) {
        this.recentBuffer += data;
        if (this.recentBuffer.length > this.recentBufferMaxSize) {
            this.recentBuffer = this.recentBuffer.slice(this.recentBufferTrimSliceSize - this.recentBufferMaxSize);
            this.recentBuffer = this.recentBuffer.substring(this.recentBuffer.indexOf('\n'));
        }
    }
};
