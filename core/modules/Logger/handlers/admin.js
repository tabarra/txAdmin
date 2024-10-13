const modulename = 'Logger:Admin';
import fsp from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import dateFormat from 'dateformat';
import { getBootDivider } from '../loggerUtils';
import consoleFactory from '@extras/console';
import { LoggerBase } from '../LoggerBase';
const console = consoleFactory(modulename);


export default class AdminLogger extends LoggerBase {
    constructor(txAdmin, basePath, lrProfileConfig) {
        const lrDefaultOptions = {
            path: basePath,
            intervalBoundary: true,
            initialRotation: true,
            history: 'admin.history',
            interval: '7d',

        };
        super(basePath, 'admin', lrDefaultOptions, lrProfileConfig);
        this.lrStream.write(getBootDivider());

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
        if (type === 'command') {
            saveMsg = `[${author}] executed "${action}"`;
            console.log(`${author} executed ` + chalk.inverse(' ' + action + ' '));
        } else {
            saveMsg = `[${author}] ${action}`;
            console.log(saveMsg);
        }
        const timestamp = dateFormat(new Date(), 'HH:MM:ss');
        this.lrStream.write(`[${timestamp}]${saveMsg}\n`);
        this.writeCounter++;
    }
};
