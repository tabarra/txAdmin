const modulename = 'OutputHandler';
import logger from '@core/extras/console.js';
import { verbose } from '@core/globalData.js';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

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
export default class OutputHandler {
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
     * @param {String} mutex
     * @param {Object} data
     */
    trace(mutex, trace) {
        try {
            //Filter valid and fresh packages
            if (mutex !== globals.fxRunner.currentMutex) return;
            // const json = JSON.stringify(trace);
            // if (json.includes('mapmanager')) {
            //     dir(trace);
            // }
            if (anyUndefined(trace, trace.value, trace.value.data, trace.value.channel)) return;
            const { channel, data } = trace.value;

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
                } catch (e) { }
                return;
            }

            //Handle watchdog
            if (channel == 'citizen-server-impl' && data.type == 'watchdog_bark') {
                try {
                    deferError(`Detected FXServer thread ${data.thread} hung with stack:`);
                    deferError(`\t${data.stack}`); //TODO: add to diagnostics page
                    deferError('Please check the resource above to prevent further hangs.');
                } catch (e) { }
                return;
            }

            //Handle script traces
            if (
                channel == 'citizen-server-impl'
                && data.type == 'script_structured_trace'
                && data.resource === 'monitor'
            ) {
                if (data.payload.type === 'txAdminHeartBeat') {
                    globals.healthMonitor.handleHeartBeat('fd3');
                } else if (data.payload.type === 'txAdminLogData') {
                    globals.logger.server.write(mutex, data.payload.logs);
                } else if (data.payload.type === 'txAdminResourceStatus') {
                    globals.resourcesManager.handleServerEvents(data.payload);
                }
            }
        } catch (error) {
            if (verbose) {
                logError('Error processing FD3 stream output:');
                dir(error);
            }
        }
    }

    /**
     * handles stdout and stderr from child fxserver and send to be processed by the logger
     * @param {String} source
     * @param {String} mutex
     * @param {String|Buffer} data likely string
     */
    write(source, mutex, data) {
        data = data.toString();
        globals.logger.fxserver.writeStdIO(source, data);

        //FIXME: deprecate this whenever
        if (this.enableCmdBuffer) this.cmdBuffer += data.replace(/\u001b[^m]*?m/g, '');
    }
};
