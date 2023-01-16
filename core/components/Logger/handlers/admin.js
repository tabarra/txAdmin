const modulename = 'Logger:Admin';
import fsp from 'node:fs/promises';
import path from 'node:path';
import dateFormat from 'dateformat';
import logger from '@core/extras/console.js';
import { verbose } from '@core/globalData';
import { LoggerBase, separator } from '@core/components/Logger/loggerUtils.js';
import chalk from 'chalk';
const { dir, log, logOk, logWarn, logError } = logger(modulename);


export default class AdminLogger extends LoggerBase {
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
            if (verbose) log(`Rotated file ${filename}`);
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
    async getRecentBuffer() {
        try {
            return await fsp.readFile(path.join(this.basePath, 'admin.log'), 'utf8');
        } catch (error) {
            return false;
        }
    }

    /**
     * Handles the input of log data
     * TODO: add here discord log forwarding
     * 
     * @param {string} author 
     * @param {string} action 
     * @param {'default'|'command'} type 
     */
    write(author, action, type = 'default') {
        let saveMsg;
        if(type === 'command'){
            saveMsg = `[${author}] executed "${action}"`;
            log(`${author} executed ` + chalk.inverse(' ' + action + ' '));
        }else{
            saveMsg = `[${author}] ${action}`;
            log(saveMsg);
        }
        const timestamp = dateFormat(new Date(), 'HH:MM:ss');
        this.lrStream.write(`[${timestamp}]${saveMsg}\n`);
        this.writeCounter++;
    }
};
