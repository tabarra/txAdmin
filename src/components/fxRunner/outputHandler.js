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

                /*
                NOTE: Expected time cap based on log size cap to prevent memory leak

                Big server: 300 events/min (freeroam/dm with 100+ players)
                Medium servers: 30 events/min (rp with up to 64 players)

                64k cap: 3.5h big, 35.5h medium, 24mb, 620ms/1000 seek time
                32k cap: 1.7h big, 17.7h medium, 12mb, 307ms/1000 seek time
                16k cap: 0.9h big, 9h medium, 6mb, 150ms/1000 seek time

                > Seek time based on getting 500 items older than cap - 1000 (so near the end of the array) run 1k times
                > Memory calculated with process.memoryUsage().heapTotal considering every event about 300 bytes

                FIXME: after testing, I could not reproduce just with log array the memory leak numbers seen in issues.
                Investigate if there are other memory leaks, or maybe if the array.concat(payload) is the issue
                To match the issue on issue #427, we would need 300k events to be a 470mb increase in rss and I
                measured only 94mb worst case scenario

                NOTE: Although we could comfortably do 64k cap, even if showing 500 lines per page, nobody would
                navigate through 128 pages, so let's do 16k cap since there is not even a way for the admin to skip
                pages since it's all relative (older/newer) just like github's tags/releases page.

                NOTE: maybe a way to let big servers filter what is logged or not? That would be an export in fxs,
                before sending it to fd3
                */

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
    write(data, markType = false) {
        //NOTE: not sure how this would throw any errors, but anyways...
        data = data.toString();
        try {
            globals.webServer.webSocket.buffer('liveconsole', data, markType);

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
            globals.webServer.webSocket.buffer('liveconsole', data, 'error');
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
