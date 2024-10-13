const modulename = 'Logger';
import rfs from 'rotating-file-stream';
import AdminLogger from './handlers/admin';
import FXServerLogger from './FXServerLogger';
import ServerLogger from './handlers/server';
import { getLogSizes } from './loggerUtils.js';
import consoleFactory from '@extras/console';
import TxAdmin from '@core/txAdmin';
const console = consoleFactory(modulename);

type LoggerConfigType = {
    admin: rfs.Options;
    fxserver: rfs.Options;
    server: rfs.Options;
}

/**
 * Main logger component that holds all the loggers.
 */
export default class Logger {
    private readonly txAdmin: TxAdmin;
    private readonly config: LoggerConfigType;
    private readonly basePath: string;
    public readonly admin: AdminLogger;
    public readonly fxserver: FXServerLogger;
    public readonly server: ServerLogger;

    constructor(txAdmin: TxAdmin, config: LoggerConfigType) {
        //Config stuff
        this.txAdmin = txAdmin;
        this.config = config;
        this.basePath = `${txAdmin.info.serverProfilePath}/logs/`;

        //Starting handlers
        this.admin = new AdminLogger(txAdmin, this.basePath, this.config.admin);
        this.fxserver = new FXServerLogger(txAdmin, this.basePath, this.config.fxserver);
        this.server = new ServerLogger(txAdmin, this.basePath, this.config.server);
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
