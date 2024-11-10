const modulename = 'Logger';
import type { Options as RfsOptions } from 'rotating-file-stream';
import AdminLogger from './handlers/admin';
import FXServerLogger from './FXServerLogger';
import ServerLogger from './handlers/server';
import { getLogSizes } from './loggerUtils.js';
import consoleFactory from '@lib/console';
import { txEnv } from '@core/globalData';
const console = consoleFactory(modulename);


/**
 * Logger module that holds the scope-specific loggers and provides some utility functions.
 */
export default class Logger {
    private readonly basePath = `${txEnv.profilePath}/logs/`;
    public readonly admin: AdminLogger;
    public readonly fxserver: FXServerLogger;
    public readonly server: ServerLogger;

    constructor() {
        this.admin = new AdminLogger(this.basePath, txConfig.logger.admin);
        this.fxserver = new FXServerLogger(this.basePath, txConfig.logger.fxserver);
        this.server = new ServerLogger(this.basePath, txConfig.logger.server);
    }


    /**
     * Returns the total size of the log files used.
     */
    getUsageStats() {
        //{loggerName: statsString}
        throw new Error('Not yet implemented.');
    }


    /**
     * Return the total size of the log files used.
     * FIXME: this regex is kinda redundant with the one from loggerUtils.js
     */
    async getStorageSize() {
        return await getLogSizes(
            this.basePath,
            /^(admin|fxserver|server)(_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}(_\d+)?)?.log$/,
        );
    }
};
