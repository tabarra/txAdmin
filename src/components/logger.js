//Requires
const fs = require('fs');
const dateFormat = require('dateformat');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'Logger';


module.exports = class Logger {
    constructor(config) {
        this.config = config;

        //Writing Log Header
        let sep = '='.repeat(64);
        let timestamp = new Date().toLocaleString();
        let header = `\r\n${sep}\r\n======== txAdmin starting - ${timestamp}\r\n${sep}\r\n`;
        try {
            fs.appendFileSync(this.config.logPath, header, 'utf8');
            logOk('::Started', context);
        } catch (error) {
            logError(`::Failed to write to log file '${this.config.logPath}'`, context);
            if(globals.config.verbose) dir(error);
            process.exit();
        }
    }


    //================================================================
    /**
     * Save log entriy
     * @param {string} data
     * @returns {boolean} success
     */
    async append(data){
        let timestamp = dateFormat(new Date(), 'HH:MM:ss');
        try {
            return fs.appendFileSync(this.config.logPath, `[${timestamp}]${data}\n`, 'utf8');
        } catch (error) {
            return false;
        }
    }


    //================================================================
    /**
     * Getter for the log contents
     * @returns {string} log data
     */
    async get(){
        try {
            return await fs.readFileSync(this.config.logPath, 'utf8')
        } catch (error) {
            return false;
        }
    }


} //Fim Logger()
