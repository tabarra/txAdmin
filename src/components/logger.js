//Requires
const fs = require('fs');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'Logger';


module.exports = class Logger {
    constructor(config) {
        logOk('::Started', context);
        this.config = config;
    }


    //================================================================
    /**
     * Save log entriy
     * @param {string} data 
     * @returns {boolean} success
     */
    async append(data){
        let timestamp = new Date().toLocaleString();
        try {
            await fs.appendFileSync(this.config.logPath, `[${timestamp}]${data}\n`, 'utf8');
            return true;
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
