//Requires
const modulename = 'Logger';
const fs = require('fs-extra');
const dateFormat = require('dateformat');
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);


module.exports = class Logger {
    constructor(config) {
        this.config = config;

        //Writing Log Header
        let sep = '='.repeat(64);
        let timestamp = new Date().toLocaleString();
        let header = `\r\n${sep}\r\n======== txAdmin starting - ${timestamp}\r\n${sep}\r\n`;
        try {
            fs.appendFileSync(this.config.logPath, header, 'utf8');
            logOk('Started');
        } catch (error) {
            logError(`Failed to write to log file '${this.config.logPath}'`);
            if(GlobalData.verbose) dir(error);
            process.exit();
        }
    }


    //================================================================
    /**
     * Save log entriy
     * @param {string} data
     */
    async append(data){
        let timestamp = dateFormat(new Date(), 'HH:MM:ss');
        try {
            await fs.appendFile(this.config.logPath, `[${timestamp}]${data}\n`, 'utf8');
        } catch (error) {
            logError(`Failed to write to log file '${this.config.logPath}'`);
        }
    }


    //================================================================
    /**
     * Getter for the log contents
     * @returns {string} log data
     */
    async get(){
        try {
            return await fs.readFile(this.config.logPath, 'utf8')
        } catch (error) {
            return false;
        }
    }


} //Fim Logger()
