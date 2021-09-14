//Requires
const modulename = 'OutputHandler';
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//Helpers
const anyUndefined = (...args) => { return [...args].some((x) => (typeof x === 'undefined')); };
const deferError = (m, t = 500) => {
    setTimeout(() => {
        logError(m);
    }, t);
};


/**
 * FXServer output helper that mostly relays to other components.
 */
module.exports = class OutputHandler {
    constructor() {
        this.enableCmdBuffer = false;
        this.cmdBuffer = '';
    }


    /**
     * Processes FD3 traces
     *
     * Mapped straces:
     *   nucleus_connected
     *   watchdog_bark
     *   bind_error
     *   script_log
     *   script_structured_trace (handled by server logger)
     *
     * @param {object} data
     */
    trace(trace) {
        //Filter valid packages
        if (anyUndefined(trace, trace.value, trace.value.data, trace.value.channel)) return;
        const {channel, data} = trace.value;

        //DEBUG
        // if(trace.value.func == 'ScriptTrace') return;
        // dir({channel,data});

        //Handle bind errors
        if (channel == 'citizen-server-impl' && data.type == 'bind_error') {
            try {
                if (!globals.fxRunner.restartDelayOverride) {
                    globals.fxRunner.restartDelayOverride = 10000;
                } else if (globals.fxRunner.restartDelayOverride <= 45000) {
                    globals.fxRunner.restartDelayOverride += 5000;
                }
                const [_ip, port] = data.address.split(':');
                deferError(`Detected FXServer error: Port ${port} is busy! Increasing restart delay to ${globals.fxRunner.restartDelayOverride}.`);
            } catch (e) {}
            return;
        }

        //Handle watchdog
        if (channel == 'citizen-server-impl' && data.type == 'watchdog_bark') {
            try {
                deferError(`Detected FXServer thread ${data.thread} hung with stack:`);
                deferError(`\t${data.stack}`);
                deferError('Please check the resource above to prevent further hangs.');
            } catch (e) {}
            return;
        }

        //Handle script traces
        if (channel == 'citizen-server-impl' && data.type == 'script_structured_trace') {
            // dir(data.payload)
            if (data.payload.type === 'txAdminHeartBeat') {
                globals.monitor.handleHeartBeat('fd3');
            } else if (data.payload.type === 'txAdminLogData') {
                //FIXME: send everything to globals.logger.server.write() and let it handle everything


                //FIXME: this is super wrong
                globals.databus.serverLog = globals.databus.serverLog.concat(data.payload.logs);
                globals.webServer.webSocket.buffer('serverlog', data.payload.logs);

                if (globals.databus.serverLog.length > 64e3) globals.databus.serverLog = globals.databus.serverLog.slice(-100);

                /*
                NOTE: Expected time cap based on log size cap to prevent memory leak

                Big server: 300 events/min (freeroam/dm with 100+ players)
                Medium servers: 30 events/min (rp with up to 64 players)

                64k cap: 3.5h big, 35.5h medium, 24mb, 620ms/1000 seek time
                32k cap: 1.7h big, 17.7h medium, 12mb, 307ms/1000 seek time
                16k cap: 0.9h big, 9h medium, 6mb, 150ms/1000 seek time

                > Seek time based on getting 500 items older than cap - 1000 (so near the end of the array) run 1k times
                > Memory calculated with process.memoryUsage().heapTotal considering every event about 300 bytes

                FIXME: after testing, I could not reproduce just with log array the memory leak numbers seen in issues.
                Investigate if there are other memory leaks, or maybe if the array.concat(payload) is the issue
                To match the issue on issue #427, we would need 300k events to be a 470mb increase in rss and I
                measured only 94mb worst case scenario

                NOTE: Although we could comfortably do 64k cap, even if showing 500 lines per page, nobody would
                navigate through 128 pages, so let's do 16k cap since there is not even a way for the admin to skip
                pages since it's all relative (older/newer) just like github's tags/releases page.

                NOTE: maybe a way to let big servers filter what is logged or not? That would be an export in fxs,
                before sending it to fd3
                */

                //NOTE: limiting to 16k requests which should be about 1h to big server (266 events/min)
                // if (globals.databus.serverLog.length > 128e3) globals.databus.serverLog.shift();
            }
        }
    }

    write(source, data) {
        data = data.toString();
        globals.logger.fxserver.writeStdIO(source, data);

        //FIXME: deprecate this whenever
        if (this.enableCmdBuffer) this.cmdBuffer += data.replace(/\u001b\[\d+(;\d)?m/g, '');
    }
}; //Fim OutputHandler()
