const modulename = 'OutputHandler';
import logger from '@core/extras/console.js';
import { anyUndefined } from '@core/extras/helpers';
import { verbose } from '@core/globalData';
import TxAdmin from '@core/txAdmin';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

//Helpers
const deferError = (m: string, t = 500) => {
    setTimeout(() => {
        logError(m);
    }, t);
};


/**
 * FXServer output helper that mostly relays to other components.
 */
export default class OutputHandler {
    readonly #txAdmin: TxAdmin;
    enableCmdBuffer = false;
    cmdBuffer = '';

    constructor(txAdmin: TxAdmin) {
        this.#txAdmin = txAdmin;
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
     */
    trace(mutex: string, trace: object) {
        try {
            //Filter valid and fresh packages
            if (mutex !== this.#txAdmin.fxRunner.currentMutex) return;
            // const json = JSON.stringify(trace);
            // if (json.includes('mapmanager')) {
            //     dir(trace);
            // }
            if (anyUndefined(trace, trace.value, trace.value.data, trace.value.channel)) return;
            const { channel, data } = trace.value;

            //Handle bind errors
            if (channel == 'citizen-server-impl' && data.type == 'bind_error') {
                try {
                    if (!this.#txAdmin.fxRunner.restartDelayOverride) {
                        this.#txAdmin.fxRunner.restartDelayOverride = 10000;
                    } else if (this.#txAdmin.fxRunner.restartDelayOverride <= 45000) {
                        this.#txAdmin.fxRunner.restartDelayOverride += 5000;
                    }
                    const [_ip, port] = data.address.split(':');
                    deferError(`Detected FXServer error: Port ${port} is busy! Increasing restart delay to ${this.#txAdmin.fxRunner.restartDelayOverride}.`);
                } catch (e) { }
                return;
            }

            //Handle bind errors
            if (channel == 'citizen-server-impl' && data.type == 'nucleus_connected') {
                if (typeof data.url !== 'string') {
                    logError(`FD3 nucleus_connected event without URL.`);
                } else {
                    try {
                        const matches = /^(https:\/\/)?.*-([0-9a-z]{6,})\.users\.cfx\.re\/?$/.exec(data.url);
                        if (!matches || !matches[2]) throw new Error(`invalid cfxid`);
                        this.#txAdmin.fxRunner.cfxId = matches[2];
                        this.#txAdmin.persistentCache.set('fxsRuntime:cfxId', matches[2]);
                    } catch (error) {
                        logError(`Error decoding server nucleus URL.`);
                    }
                }
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
                    this.#txAdmin.healthMonitor.handleHeartBeat('fd3');
                } else if (data.payload.type === 'txAdminLogData') {
                    this.#txAdmin.logger.server.write(data.payload.logs, mutex);
                } else if (data.payload.type === 'txAdminResourceEvent') {
                    this.#txAdmin.resourcesManager.handleServerEvents(data.payload, mutex);
                } else if (data.payload.type === 'txAdminPlayerlistEvent') {
                    this.#txAdmin.playerlistManager.handleServerEvents(data.payload, mutex);
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
     */
    write(source: string, mutex: string, data: string | Buffer) {
        data = data.toString();
        this.#txAdmin.logger.fxserver.writeStdIO(source, data);

        //FIXME: deprecate this whenever
        if (this.enableCmdBuffer) this.cmdBuffer += data.replace(/\u001b[^m]*?m/g, '');
    }
};
