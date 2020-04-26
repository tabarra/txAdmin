//Requires
const modulename = 'ConsoleBuffer';
const fs = require('fs');
const ac = require('ansi-colors');
ac.enabled = true;
const StreamSnitch = require('stream-snitch');
const bytes = require('bytes');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);


/**
 * FXServer output buffer helper.
 *
 * FIXME: optimize this, we can have only one buffer using offset variables
 * @param {string} logPath
 * @param {int} saveInterval
 */
module.exports = class ConsoleBuffer {
    constructor(logPath, saveInterval) {
        this.logFileSize = null;
        this.logPath = logPath;
        this.enableCmdBuffer = false;
        this.cmdBuffer = '';
        this.webConsoleBuffer = '';
        this.fileBuffer = '';

        //FIXME: this is stupid, please fix
        this.hitchStreamProcessor = null;
        this.portStreamProcessor = null;
        this.hangStreamProcessor = null;
        this.hangStackStreamProcessor = null;
        this.setupStreamHandlers();

        //Start log file
        try {
            fs.writeFileSync(this.logPath, '');
        } catch (error) {
            logError(`Failed to create log file '${this.logPath}' with error: ${error.message}`)
        }

        //Cron Function
        setInterval(this.saveLog.bind(this), saveInterval*1000);
    }


    //================================================================
    /**
     * Setup the stream handlers
     */
    setupStreamHandlers(){
        // NOTE: detect these:
        // server thread hitch warning: timer interval of %d milliseconds
        // network thread hitch warning: timer interval of %d milliseconds
        // hitch warning: frame time of %d milliseconds
        this.hitchStreamProcessor = new StreamSnitch(
            /hitch warning: (frame time|timer interval) of (\d{3,5}) milliseconds/g,
            (m) => { try{globals.monitor.processFXServerHitch(m[2])}catch(e){} }
        );
        this.hitchStreamProcessor.on('error', (data) => {});


        //NOTE: detect these:
        //"Could not bind on 0.0.0.0:30120 - is this address valid and not already in use?"
        //"Loop %s seems hung! (last checkin %d seconds ago)"
        //"Warning: %s watchdog stack: %s"

        //FIXME: this is stupid, please fix
        const deferError = (m, t=500) => {
            setTimeout(() => {
                logError(m);
            }, t);
        }
        this.portStreamProcessor = new StreamSnitch(
            /Could not bind on ([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\:([0-9]{1,5})/ig,
            (m) => { 
                try{
                    if(!globals.fxRunner.restartDelayOverride){
                        globals.fxRunner.restartDelayOverride = 10000;
                    }else if(globals.fxRunner.restartDelayOverride <= 45000){
                        globals.fxRunner.restartDelayOverride += 5000;
                    }
                    deferError(`Detected FXServer error: Port ${m[2]} is busy! Increasing restart delay to ${globals.fxRunner.restartDelayOverride}.`);
                }catch(e){} 
            }
        );
        this.portStreamProcessor.on('error', (data) => {});

        this.hangStreamProcessor = new StreamSnitch(
            /Loop (default|svMain|svNetwork) seems hung!/ig,
            (m) => { try{deferError(`Detected FXServer error: thread ${m[1]} hung!`)}catch(e){} }
        );
        this.hangStreamProcessor.on('error', (data) => {});

        this.hangStackStreamProcessor = new StreamSnitch(
            /(default|svMain|svNetwork) watchdog stack: (.*)/ig,
            (m) => { try{deferError(`Detected FXServer error: thread ${m[1]} hung with stack: ${m[2]}`)}catch(e){} }
        );
        this.hangStackStreamProcessor.on('error', (data) => {});
    }//Final setupStreamHandlers()


    //================================================================
    /**
     * Write data to all buffers
     * @param {string} data
     * @param {string} markType
     */
    write(data, markType) {
        if(typeof markType === 'undefined') markType = false;
        //NOTE: not sure how this would throw any errors, but anyways...
        data = data.toString();
        try {
            //FIXME: this is super stupid, fix it asap
            this.hitchStreamProcessor.write(data);
            this.portStreamProcessor.write(data);
            this.hangStreamProcessor.write(data);
            this.hangStackStreamProcessor.write(data);
            globals.webServer.webConsole.buffer(data, markType);

            //NOTE: There used to be a rule "\x0B-\x1F" that was replaced with "x0B-\x1A\x1C-\x1F" to allow the \x1B terminal escape character.
            //This is neccessary for the terminal to have color, but beware of side effects.
            //This regex was done in the first place to prevent fxserver output to be interpreted as txAdmin output by the host terminal
            //IIRC the issue was that one user with a TM on their nick was making txAdmin's console to close or freeze. I couldn't reproduce the issue.
            if(!globals.fxRunner.config.quiet) process.stdout.write(data.replace(/[\x00-\x08\x0B-\x1A\x1C-\x1F\x7F-\x9F\x80-\x9F\u2122]/g, ""));
        } catch (error) {
            if(GlobalData.verbose) logError(`Buffer write error: ${error.message}`);
        }

        //Adding data to the buffers
        if(this.enableCmdBuffer) this.cmdBuffer += data;
        this.fileBuffer += data;
        this.webConsoleBuffer += data;
        if(this.webConsoleBuffer.length > 16*1024){
            //TODO: use xxx.indexOf("\n")
            this.webConsoleBuffer = this.webConsoleBuffer.slice(-8*1024);
        }
    }


    //================================================================
    /**
     * Print fxChild's stderr to the webconsole and to the terminal
     * @param {string} data
     */
    writeError(data) {
        //FIXME: this should be saving to a file, and should be persistent to the web console
        data = data.toString();
        try {
            globals.webServer.webConsole.buffer(data, 'error');
            if(!globals.fxRunner.config.quiet) process.stdout.write(ac.red(data.replace(/[\x00-\x08\x0B-\x1F\x7F-\x9F\x80-\x9F\u2122]/g, "")));
        } catch (error) {
            if(GlobalData.verbose) logError(`Buffer write error: ${error.message}`)
        }
    }


    //================================================================
    /**
     * Save the log file and clear buffer
     */
    writeHeader() {
        let sep = '='.repeat(64);
        let timestamp = new Date().toLocaleString();
        let header = `\r\n${sep}\r\n======== FXServer starting - ${timestamp}\r\n${sep}\r\n`;
        this.write(header, 'info');
    }


    //================================================================
    /**
     * Save the log file and clear buffer
     */
    saveLog() {
        if(!this.fileBuffer.length) return;
        let cleanBuff = this.fileBuffer.replace(/\u001b\[\d+(;\d)?m/g, '');
        fs.appendFile(this.logPath, cleanBuff, {encoding: 'utf8'}, (error)=>{
            if(error){
                if(GlobalData.verbose) logError(`File Write Buffer error: ${error.message}`)
            }else{
                this.fileBuffer = '';
            }
        });
        fs.stat(this.logPath, (error, stats)=>{
            if(error){
                if(GlobalData.verbose) logError(`Log File get stats error: ${error.message}`)
            }else{
                this.logFileSize = bytes(stats.size);
            }
        });
    }

} //Fim ConsoleBuffer()
