const modulename = 'Fd3Handler';
import { anyUndefined } from '@core/extras/helpers';
import TxAdmin from '@core/txAdmin';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);

//Helpers
const deferError = (m: string, t = 500) => {
    setTimeout(() => {
        console.error(m);
    }, t);
};

type StructuredTraceType = {
    key: number;
    value: {
        channel: string;
        data: any;
        file: string;
        func: string;
        line: number;
    }
}


/**
 * Handles all the FD3 traces from the FXServer
 */
export default class Fd3Handler {
    readonly #txAdmin: TxAdmin;

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
    public write(mutex: string, trace: StructuredTraceType) {
        try {
            //Filter valid and fresh packages
            if (mutex !== this.#txAdmin.fxRunner.currentMutex) return;
            if (anyUndefined(trace, trace.value, trace.value.data, trace.value.channel)) return;
            const { channel, data } = trace.value;

            //Handle bind errors
            if (channel === 'citizen-server-impl' && data?.type === 'bind_error') {
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

            //Handle nucleus auth
            if (channel === 'citizen-server-impl' && data.type === 'nucleus_connected') {
                if (typeof data.url !== 'string') {
                    console.error(`FD3 nucleus_connected event without URL.`);
                } else {
                    try {
                        const matches = /^(https:\/\/)?.*-([0-9a-z]{6,})\.users\.cfx\.re\/?$/.exec(data.url);
                        if (!matches || !matches[2]) throw new Error(`invalid cfxid`);
                        this.#txAdmin.fxRunner.cfxId = matches[2];
                        this.#txAdmin.persistentCache.set('fxsRuntime:cfxId', matches[2]);
                    } catch (error) {
                        console.error(`Error decoding server nucleus URL.`);
                    }
                }
                return;
            }

            //Handle watchdog
            if (channel === 'citizen-server-impl' && data.type === 'watchdog_bark') {
                deferError(`Detected FXServer thread ${data?.thread ?? 'unknown'} hung with stack:`);
                deferError(`\t${data?.stack ?? 'unknown'}`); //TODO: add to diagnostics page
                deferError('Please check the resource above to prevent further hangs.');
                return;
            }

            // if (data.type == 'script_log') {
            //     return console.dir(data);
            // }

            //Handle script traces
            if (
                channel === 'citizen-server-impl'
                && data.type === 'script_structured_trace'
                && data.resource === 'monitor'
            ) {
                if (data.payload.type === 'txAdminHeartBeat') {
                    this.#txAdmin.healthMonitor.handleHeartBeat('fd3');
                } else if (data.payload.type === 'txAdminLogData') {
                    this.#txAdmin.logger.server.write(data.payload.logs, mutex);
                } else if (data.payload.type === 'txAdminLogNodeHeap') {
                    this.#txAdmin.statsManager.svRuntime.logServerNodeMemory(data.payload);
                } else if (data.payload.type === 'txAdminResourceEvent') {
                    this.#txAdmin.resourcesManager.handleServerEvents(data.payload, mutex);
                } else if (data.payload.type === 'txAdminPlayerlistEvent') {
                    this.#txAdmin.playerlistManager.handleServerEvents(data.payload, mutex);
                } else if (data.payload.type === 'txAdminCommandBridge') {
                    this.bridgeCommand(data.payload);
                } else if (data.payload.type === 'txAdminAckWarning') {
                    this.#txAdmin.playerDatabase.ackWarnAction(data.payload.actionId);
                }
            }
        } catch (error) {
            console.verbose.error('Error processing FD3 stream output:');
            console.verbose.dir(error);
        }
    }


    /**
     * handles stdout and stderr from child fxserver and send to be processed by the logger
     * TODO: use zod for type safety
     */
    private bridgeCommand(payload: any) {
        if (payload.command === 'announcement') {
            try {
                //Validate input
                if (typeof payload.author !== 'string') throw new Error(`invalid author`);
                if (typeof payload.message !== 'string') throw new Error(`invalid message`);
                const message = (payload.message ?? '').trim();
                if (!message.length) throw new Error(`empty message`);

                //Resolve admin
                const author = payload.author;
                this.#txAdmin.logger.admin.write(author, `Sending announcement: ${message}`);

                // Dispatch `txAdmin:events:announcement`
                this.#txAdmin.fxRunner.sendEvent('announcement', { message, author });

                // Sending discord announcement
                const publicAuthor = this.#txAdmin.adminVault.getAdminPublicName(payload.author, 'message');
                this.#txAdmin.discordBot.sendAnnouncement({
                    type: 'info',
                    title: {
                        key: 'nui_menu.misc.announcement_title',
                        data: { author: publicAuthor }
                    },
                    description: message
                });
            } catch (error) {
                console.verbose.warn(`bridgeCommand handler error:`);
                console.verbose.dir(error);
            }
        } else {
            console.warn(`Command bridge received invalid command:`);
            console.dir(payload);
        }
    }
};
