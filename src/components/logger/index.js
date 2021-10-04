//Requires
const modulename = 'Logger';
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);
const AdminLogger = require('./handlers/admin');
const FXServerLogger = require('./handlers/fxserver');
const ServerLogger = require('./handlers/server');
const { getLogSizes } = require('./loggerUtils');

// NOTE: to turn this into an universal class outside txAdmin() instance
// when a txAdmin profile starts, it does universal.logger.start(profilename)
// and then the logger can be called as universal.logger.profiles[profilename].fxserver
module.exports = class Logger {
    constructor(config) {
        //FIXME: move these to class fields as soon as eslint v8 drops
        this.admin = null;
        this.fxserver = null;
        this.server = null;
        this.console = null;
        this.config = null;

        //Config stuff
        this.config = config;
        this.basePath = `${globals.info.serverProfilePath}/logs/`;

        //Starting handlers
        this.admin = new AdminLogger(this.basePath, this.config.admin);
        this.fxserver = new FXServerLogger(this.basePath, this.config.fxserver);
        this.server = new ServerLogger(this.basePath, this.config.server);
        // this.console = null;
    }


    //================================================================
    getUsageStats() {
        //{loggerName: statsString}
        throw new Error('Not yet implemented.');
    }


    //================================================================
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
}; //Fim Logger()
