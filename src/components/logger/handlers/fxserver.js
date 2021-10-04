//Requires
const modulename = 'Logger:FXServer';
const bytes = require('bytes');
const chalk = require('chalk');
const { dir, log, logOk, logWarn, logError } = require('../../../extras/console')(modulename);
const { LoggerBase, separator } = require('../loggerUtils');


//NOTE: There used to be a rule "\x0B-\x1F" that was replaced with "x0B-\x1A\x1C-\x1F" to allow the \x1B terminal escape character.
//This is neccessary for the terminal to have color, but beware of side effects.
//This regex was done in the first place to prevent fxserver output to be interpreted as txAdmin output by the host terminal
//IIRC the issue was that one user with a TM on their nick was making txAdmin's console to close or freeze. I couldn't reproduce the issue.
// \x00-\x08 control chars
// allow \r and \t
// \x0B-\x1A control chars
// allow \e (escape for colors)
// \x1C-\x1F control chars
// allow all printable
// \x7F-\x9F ??????
// \u2122 trademark symbol
const regexConsole = /[\x00-\x08\x0B-\x1A\x1C-\x1F\x7F-\x9F\x80-\x9F\u2122]/g;
const regexEscape = /\u001b[^m]*?m/g;

const markLines = (msg, type) => {
    return msg.trim().split('\n').map((l) => `{txMarker-${type}}${l}{/txMarker}`).join('\n') + '\n';
};


module.exports = class FXServerLogger extends LoggerBase {
    constructor(basePath, lrProfileConfig) {
        const lrDefaultOptions = {
            path: basePath,
            intervalBoundary: true,
            initialRotation: true,
            history: 'fxserver.history',
            // compress: 'gzip', //don't forget to do `mv filename filename.gz`
            interval: '1d',
            maxFiles: 7,
            maxSize: '5G',

        };
        super(basePath, 'fxserver', lrDefaultOptions, lrProfileConfig);
        this.lrStream.on('rotated', (filename) => {
            this.lrStream.write(`\n${separator('Log Rotated')}\n`);
            if (GlobalData.verbose) log(`Rotated file ${filename}`);
        });


        this.recentBuffer = '';
        this.recentBufferMaxSize = 128 * 1024; //128kb
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
     */
    writeMarker(type, data) {
        if (type === 'starting') {
            const msg = separator('FXServer Starting');
            this.lrStream.write(`\n${msg}\n`);
            process.stdout.write(`\n${chalk.bgBlue(msg)}\n`);
            const coloredMarkData = `\n\n${markLines(msg, 'info')}\n`;
            globals.webServer.webSocket.buffer('liveconsole', coloredMarkData);
            this.appendRecent(coloredMarkData);
        } else if (type === 'command') {
            const msg = `> ${data}`;
            this.lrStream.write(`${msg}\n`);
            const coloredMarkData = markLines(msg, 'cmd');
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
        this.lrStream.write(data.replace(regexEscape, ''));

        //Clean data
        const consoleData = data
            .replace(regexConsole, '') //removing console-breaking chars
            .replace(/txMarker/g, 'tx\u200BMarker'); //just to prevent resources from injecting markers

        //For the terminal
        if (!globals.fxRunner.config.quiet) {
            const coloredAnsiData = (type === 'stdout') ? consoleData : chalk.redBright(consoleData);
            process.stdout.write(coloredAnsiData);
        }

        //For the live console
        const coloredMarkData = (type === 'stdout') ? consoleData : markLines(consoleData, 'error');
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
            this.recentBuffer = this.recentBuffer.slice(-0.5 * this.recentBufferMaxSize);
            this.recentBuffer = this.recentBuffer.substr(this.recentBuffer.indexOf('\n'));
        }
    }
};
