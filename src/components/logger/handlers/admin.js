//Requires
const modulename = 'Logger:Admin';
const fsp = require('fs').promises;
const path = require('path');
const dateFormat = require('dateformat');
const { dir, log, logOk, logWarn, logError } = require('../../../extras/console')(modulename);
const { LoggerBase, separator } = require('../loggerUtils');


module.exports = class AdminLogger extends LoggerBase {
    constructor(basePath, lrProfileConfig) {
        const lrDefaultOptions = {
            path: basePath,
            intervalBoundary: true,
            initialRotation: true,
            history: 'admin.history',
            interval: '7d',

        };
        super(basePath, 'admin', lrDefaultOptions, lrProfileConfig);
        this.lrStream.write(`\n${separator('txAdmin Starting')}\n`);
        this.lrStream.on('rotated', (filename) => {
            this.lrStream.write(`\n${separator('Log Rotated')}\n`);
            if (GlobalData.verbose) log(`Rotated file ${filename}`);
        });

        this.writeCounter = 0;
    }

    /**
     * Returns a string with short usage stats
     */
    getUsageStats() {
        return `Writes: ${this.writeCounter}, lrErrors: ${this.lrErrors}`;
    }

    /**
     * Returns an string with everything in admin.log (the active log rotate file)
     */
    getRecentBuffer() {
        try {
            return fsp.readFile(path.join(this.basePath, 'admin.log'), 'utf8');
        } catch (error) {
            return false;
        }
    }

    /**
     * Handles the input of log data
     * @param {string} data
     */
    write(data) {
        const timestamp = dateFormat(new Date(), 'HH:MM:ss');
        this.lrStream.write(`[${timestamp}] ${data}\n`);
        this.writeCounter++;
    }
};
