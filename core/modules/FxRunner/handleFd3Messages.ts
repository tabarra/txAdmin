import { anyUndefined } from '@lib/misc';
import consoleFactory from '@lib/console';
const console = consoleFactory('FXProc:FD3');


//Types
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
 * Handles bridged commands from txResource.  
 * TODO: use zod for type safety
 */
const handleBridgedCommands = (payload: any) => {
    if (payload.command === 'announcement') {
        try {
            //Validate input
            if (typeof payload.author !== 'string') throw new Error(`invalid author`);
            if (typeof payload.message !== 'string') throw new Error(`invalid message`);
            const message = (payload.message ?? '').trim();
            if (!message.length) throw new Error(`empty message`);

            //Resolve admin
            const author = payload.author;
            txCore.logger.admin.write(author, `Sending announcement: ${message}`);

            // Dispatch `txAdmin:events:announcement`
            txCore.fxRunner.sendEvent('announcement', { message, author });

            // Sending discord announcement
            const publicAuthor = txCore.adminStore.getAdminPublicName(payload.author, 'message');
            txCore.discordBot.sendAnnouncement({
                type: 'info',
                title: {
                    key: 'nui_menu.misc.announcement_title',
                    data: { author: publicAuthor }
                },
                description: message
            });
        } catch (error) {
            console.verbose.warn(`handleBridgedCommands handler error:`);
            console.verbose.dir(error);
        }
    } else {
        console.warn(`Command bridge received invalid command:`);
        console.dir(payload);
    }
}


/**
 * Processes FD3 Messages
 *
 * Mapped message types:
 * - nucleus_connected
 * - watchdog_bark
 * - bind_error
 * - script_log
 * - script_structured_trace (handled by server logger)
 */
const handleFd3Messages = (mutex: string, trace: StructuredTraceType) => {
    //Filter valid and fresh packages
    if (!mutex || mutex !== txCore.fxRunner.child?.mutex) return;
    if (anyUndefined(trace, trace.value, trace.value.data, trace.value.channel)) return;
    const { channel, data } = trace.value;

    //Handle bind errors
    if (channel === 'citizen-server-impl' && data?.type === 'bind_error') {
        try {
            const newDelayBackoffMs = txCore.fxRunner.signalSpawnBackoffRequired(true);
            const [_ip, port] = data.address.split(':');
            const secs = Math.floor(newDelayBackoffMs / 1000);
            console.defer().error(`Detected FXServer error: Port ${port} is busy! Setting backoff delay to ${secs}s.`);
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
                txCore.cacheStore.set('fxsRuntime:cfxId', matches[2]);
            } catch (error) {
                console.error(`Error decoding server nucleus URL.`);
            }
        }
        return;
    }

    //Handle watchdog
    if (channel === 'citizen-server-impl' && data.type === 'watchdog_bark') {
        setTimeout(() => {
            const thread = data?.thread ?? 'UNKNOWN';
            if(!data?.stack || data.stack.trim() === 'root'){
                console.error(`Detected server thread ${thread} hung without a stack trace.`);
            } else {
                console.error(`Detected server thread ${thread} hung with stack:`);
                console.error(`- ${data.stack}`);
                console.error('Please check the resource above to prevent server restarts.');
            }
        }, 250);
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
            txCore.fxMonitor.handleHeartBeat('fd3');
        } else if (data.payload.type === 'txAdminLogData') {
            txCore.logger.server.write(data.payload.logs, mutex);
        } else if (data.payload.type === 'txAdminLogNodeHeap') {
            txCore.metrics.svRuntime.logServerNodeMemory(data.payload);
        } else if (data.payload.type === 'txAdminResourceEvent') {
            txCore.fxResources.handleServerEvents(data.payload, mutex);
        } else if (data.payload.type === 'txAdminPlayerlistEvent') {
            txCore.fxPlayerlist.handleServerEvents(data.payload, mutex);
        } else if (data.payload.type === 'txAdminCommandBridge') {
            handleBridgedCommands(data.payload);
        } else if (data.payload.type === 'txAdminAckWarning') {
            txCore.database.actions.ackWarn(data.payload.actionId);
        }
    }
    
}


/**
 * Handles all the FD3 traces from the FXServer  
 * NOTE: this doesn't need to be a class, but might need to hold state in the future
 */
export default (mutex: string, trace: StructuredTraceType) => {
    try {
        handleFd3Messages(mutex, trace);
    } catch (error) {
        console.verbose.error('Error processing FD3 stream output:');
        console.verbose.dir(error);
    }
};
