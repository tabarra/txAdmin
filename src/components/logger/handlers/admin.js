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
        this.lrStream.write(separator('txAdmin Starting'));
        this.lrStream.on('rotated', (filename) => {
            if (GlobalData.verbose) log(`Rotated file ${filename}`);
            this.lrStream.write(separator('Log Rotated'));
        });

        this.writeCounter = 0;
    }

    getUsageStats() {
        return `Writes: ${this.writeCounter}, Errors: ${this.lrErrors}`;
    }

    getRecentBuffer() {
        try {
            return fsp.readFile(path.join(this.basePath, 'admin.log'), 'utf8');
        } catch (error) {
            return false;
        }
    }

    write(data) {
        const timestamp = dateFormat(new Date(), 'HH:MM:ss');
        this.lrStream.write(`[${timestamp}]${data}\n`);
        this.writeCounter++;
    }
};
