//Requires
const modulename = 'OutputHandler';
const fs = require('fs');
const chalk = require('chalk');
const bytes = require('bytes');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Helpers
const anyUndefined = (...args) => { return [...args].some((x) => (typeof x === 'undefined')); };
const deferError = (m, t = 500) => {
    setTimeout(() => {
        logError(m);
    }, t);
};


/**
 * FXServer output buffer helper.
 *
 * FIXME: optimize this, we can have only one buffer using offset variables
 * @param {string} logPath
 * @param {int} saveInterval
 */
module.exports = class OutputHandler {
    constructor(logPath, saveInterval) {
        this.logFileSize = null;
        this.logPath = logPath;
        this.enableCmdBuffer = false;
        this.cmdBuffer = '';
        this.webConsoleBuffer = '';
        this.webConsoleBufferSize = 128 * 1024; //128kb
        this.fileBuffer = '';

        //Start log file
        try {
            fs.writeFileSync(this.logPath, '');
        } catch (error) {
            logError(`Failed to create log file '${this.logPath}' with error: ${error.message}`);
        }

        //Cron Function
        setInterval(this.saveLog.bind(this), saveInterval * 1000);
    }


    /**
     * Processes FD3 traces
     *
     * Mapped straces:
     *   nucleus_connected
     *   watchdog_bark
     *   bind_error
     *   script_log
     *   script_structured_trace (not used)
     *
     * @param {object} data
     */
    trace(trace) {
        //Filter valid packages
        if (anyUndefined(trace, trace.value, trace.value.data, trace.value.channel)) return;
        const {channel, data} = trace.value;

        //DEBUG
        // if(trace.value.func == 'ScriptTrace') return;
        // dir({channel,data});

        //Handle bind errors
        if (channel == 'citizen-server-impl' && data.type == 'bind_error') {
            try {
                if (!globals.fxRunner.restartDelayOverride) {
                    globals.fxRunner.restartDelayOverride = 10000;
                } else if (globals.fxRunner.restartDelayOverride <= 45000) {
                    globals.fxRunner.restartDelayOverride += 5000;
                }
                const [_ip, port] = data.address.split(':');
                deferError(`Detected FXServer error: Port ${port} is busy! Increasing restart delay to ${globals.fxRunner.restartDelayOverride}.`);
            } catch (e) {}
            return;
        }

        //Handle watchdog
        if (channel == 'citizen-server-impl' && data.type == 'watchdog_bark') {
            try {
                deferError(`Detected FXServer thread ${data.thread} hung with stack:`);
                deferError(`\t${data.stack}`);
                deferError('Please check the resource above to prevent further hangs.');
            } catch (e) {}
            return;
        }

        //Handle script traces
        if (channel == 'citizen-server-impl' && data.type == 'script_structured_trace') {
            // dir(data.payload)
            if (data.payload.type === 'txAdminHeartBeat') {
                globals.monitor.handleHeartBeat('fd3');
            } else if (data.payload.type === 'txAdminLogData') {
                globals.databus.serverLog = globals.databus.serverLog.concat(data.payload.logs);

                //NOTE: limiting to 16k requests which should be about 1h to big server (266 events/min)
                // if (globals.databus.serverLog.length > 128e3) globals.databus.serverLog.shift();
                //FIXME: this is super wrong
                if (globals.databus.serverLog.length > 64e3) globals.databus.serverLog = globals.databus.serverLog.slice(-100);
            }
        }
    }


    /**
     * Write data to all buffers
     * @param {string} data
     * @param {string} markType
     */
    write(data, markType) {
        if (typeof markType === 'undefined') markType = false;
        //NOTE: not sure how this would throw any errors, but anyways...
        data = data.toString();
        try {
            globals.webServer.webConsole.buffer(data, markType);

            //NOTE: There used to be a rule "\x0B-\x1F" that was replaced with "x0B-\x1A\x1C-\x1F" to allow the \x1B terminal escape character.
            //This is neccessary for the terminal to have color, but beware of side effects.
            //This regex was done in the first place to prevent fxserver output to be interpreted as txAdmin output by the host terminal
            //IIRC the issue was that one user with a TM on their nick was making txAdmin's console to close or freeze. I couldn't reproduce the issue.
            if (!globals.fxRunner.config.quiet) process.stdout.write(data.replace(/[\x00-\x08\x0B-\x1A\x1C-\x1F\x7F-\x9F\x80-\x9F\u2122]/g, ''));
        } catch (error) {
            if (GlobalData.verbose) logError(`Buffer write error: ${error.message}`);
        }

        //Adding data to the buffers
        if (this.enableCmdBuffer) this.cmdBuffer += data;
        this.fileBuffer += data;

        this.webConsoleBuffer = this.webConsoleBuffer + data;
        if (this.webConsoleBuffer.length > this.webConsoleBufferSize) {
            this.webConsoleBuffer = this.webConsoleBuffer.slice(-0.5 * this.webConsoleBufferSize);
            this.webConsoleBuffer = this.webConsoleBuffer.substr(this.webConsoleBuffer.indexOf('\n'));
        }
    }


    /**
     * Print fxChild's stderr to the webconsole and to the terminal
     * @param {string} data
     */
    writeError(data) {
        //FIXME: this should be saving to a file, and should be persistent to the web console
        data = data.toString();
        try {
            globals.webServer.webConsole.buffer(data, 'error');
            if (!globals.fxRunner.config.quiet) process.stdout.write(chalk.red(data.replace(/[\x00-\x08\x0B-\x1F\x7F-\x9F\x80-\x9F\u2122]/g, '')));
        } catch (error) {
            if (GlobalData.verbose) logError(`Buffer write error: ${error.message}`);
        }
    }


    /**
     * Save the log file and clear buffer
     */
    writeHeader() {
        let sep = '='.repeat(64);
        let timestamp = new Date().toLocaleString();
        let header = `\r\n${sep}\r\n======== FXServer starting - ${timestamp}\r\n${sep}\r\n`;
        this.write(header, 'info');
    }


    /**
     * Save the log file and clear buffer
     */
    saveLog() {
        if (!this.fileBuffer.length) return;
        let cleanBuff = this.fileBuffer.replace(/\u001b\[\d+(;\d)?m/g, '');
        fs.appendFile(this.logPath, cleanBuff, {encoding: 'utf8'}, (error) => {
            if (error) {
                if (GlobalData.verbose) logError(`File Write Buffer error: ${error.message}`);
            } else {
                this.fileBuffer = '';
            }
        });
        fs.stat(this.logPath, (error, stats) => {
            if (error) {
                if (GlobalData.verbose) logError(`Log File get stats error: ${error.message}`);
            } else {
                this.logFileSize = bytes(stats.size);
            }
        });
    }
}; //Fim OutputHandler()
