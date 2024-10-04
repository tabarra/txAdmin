/* eslint-disable padded-blocks */
const modulename = 'Logger:Server';
import { LoggerBase } from '../LoggerBase';
import { getBootDivider } from '../loggerUtils';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);

/*
NOTE: Expected time cap based on log size cap to prevent memory leak
Big server: 300 events/min (freeroam/dm with 100+ players)
Medium servers: 30 events/min (rp with up to 64 players)

64k cap: 3.5h big, 35.5h medium, 24mb, 620ms/1000 seek time
32k cap: 1.7h big, 17.7h medium, 12mb, 307ms/1000 seek time
16k cap: 0.9h big, 9h medium, 6mb, 150ms/1000 seek time

> Seek time based on getting 500 items older than cap - 1000 (so near the end of the array) run 1k times
> Memory calculated with process.memoryUsage().heapTotal considering every event about 300 bytes

NOTE: Although we could comfortably do 64k cap, even if showing 500 lines per page, nobody would
navigate through 128 pages, so let's do 16k cap since there is not even a way for the admin to skip
pages since it's all relative (older/newer) just like github's tags/releases page.

NOTE: Final code after 2.5h at 2400 events/min with websocket client the memory usage was 135mb


TODO: maybe a way to let big servers filter what is logged or not? That would be an export in fxs,
before sending it to fd3
*/

//DEBUG testing stuff
// let cnt = 0;
// setInterval(() => {
//     cnt++;
//     if (cnt > 84) cnt = 1;
//     const mtx = globals.fxRunner.currentMutex || 'lmao';
//     const payload = [
//         {
//             src: 'tx',
//             ts: Date.now(),
//             type: 'DebugMessage',
//             data: cnt + '='.repeat(cnt),
//         },
//     ];
//     globals.logger.server.write(mtx, payload);
// }, 750);


export default class ServerLogger extends LoggerBase {
    constructor(txAdmin, basePath, lrProfileConfig) {
        const lrDefaultOptions = {
            path: basePath,
            intervalBoundary: true,
            initialRotation: true,
            history: 'server.history',
            // compress: 'gzip',
            interval: '1d',
            maxFiles: 7,
            maxSize: '10G',

        };
        super(basePath, 'server', lrDefaultOptions, lrProfileConfig);
        this.lrStream.write(getBootDivider());

        this.recentBuffer = [];
        this.recentBufferMaxSize = 32e3;
    }


    /**
     * Returns a string with short usage stats
     * TODO: calculate events per minute moving average 10 && peak
     */
    getUsageStats() {
        return `Buffer: ${this.recentBuffer.length},  lrErrors: ${this.lrErrors}`;
    }


    /***
     * Returns the recent fxserver buffer containing HTML markers, and not XSS escaped.
     * The size of this buffer is usually above 64kb, never above 128kb.
     * @param {Number} lastN
     * @returns the recent buffer, optionally only the last N elements
     */
    getRecentBuffer(lastN) {
        return (lastN) ? this.recentBuffer.slice(-lastN) : this.recentBuffer;
    }


    /**
     * Processes the FD3 log array
     * @param {Array} data
     * @param {String} mutex
     */
    write(data, mutex) {
        if (!Array.isArray(data)) {
            console.verbose.warn(`write() expected array, got ${typeof data}`);
            return false;
        }

        //Processing events
        for (let i = 0; i < data.length; i++) {
            try {
                const { eventObject, eventString } = this.processEvent(data[i], mutex);
                if (!eventObject || !eventString) {
                    console.verbose.warn('Failed to parse event:');
                    console.verbose.dir(data[i]);
                    continue;
                }

                //Add to recent buffer
                this.recentBuffer.push(eventObject);
                if (this.recentBuffer.length > this.recentBufferMaxSize) this.recentBuffer.shift();

                //Send to websocket
                globals.webServer.webSocket.buffer('serverlog', eventObject);

                //Write to file
                this.lrStream.write(`${eventString}\n`);
            } catch (error) {
                console.verbose.error('Error processing FD3 txAdminLogData:');
                console.verbose.dir(error);
            }
        }
    }


    /**
     * Processes an event and returns both the string for log file, and object for the web ui
     * @param {Object} eventData
     * @param {String} mutex
     */
    processEvent(eventData, mutex) {
        //Get source + handle playerJoining
        let srcObject; //to be sent to the UI
        let srcString; //to ve saved to the log file
        if (eventData.src === 'tx') {
            srcObject = { id: false, name: 'txAdmin' };
            srcString = 'txAdmin';

        } else if (typeof eventData.src === 0) {
            srcObject = { id: false, name: 'CONSOLE' };
            srcString = 'CONSOLE';

        } else if (typeof eventData.src === 'number' && eventData.src > 0) {
            const player = globals.playerlistManager.getPlayerById(eventData.src);
            if (player) {
                //FIXME: playermutex must be a ServerPlayer prop, already considering mutex, netid and rollover
                const playerID = `${mutex}#${eventData.src}`;
                srcObject = { id: playerID, name: player.displayName };
                srcString = `[${playerID}] ${player.displayName}`;
            } else {
                srcObject = { id: false, name: 'UNKNOWN PLAYER' };
                srcString = 'UNKNOWN PLAYER';
                console.verbose.warn('Unknown numeric event source from object:');
                console.verbose.dir(eventData);
            }
        } else {
            srcObject = { id: false, name: 'UNKNOWN' };
            srcString = 'UNKNOWN';
        }


        //Process event types (except playerJoining)
        //TODO: normalize/padronize actions
        let eventMessage; //to be sent to the UI + saved to the log
        if (eventData.type === 'playerJoining') {
            const idsString = eventData?.data?.ids.join('; ') ?? '';
            eventMessage = `joined with identifiers [${idsString}]`;

        } else if (eventData.type === 'playerDropped') {
            const reason = eventData.data.reason || 'UNKNOWN REASON';
            eventMessage = `disconnected (${reason})`;

        } else if (eventData.type === 'ChatMessage') {
            const text = (typeof eventData.data.text === 'string') ? eventData.data.text.replace(/\^([0-9])/g, '') : 'unknown message';
            eventMessage = (typeof eventData.data.author === 'string' && eventData.data.author !== srcObject.name)
                ? `(${eventData.data.author}): said "${text}"`
                : `said "${text}"`;

        } else if (eventData.type === 'DeathNotice') {
            const cause = eventData.data.cause || 'unknown';
            if (typeof eventData.data.killer === 'number' && eventData.data.killer > 0) {
                const killer = globals.playerlistManager.getPlayerById(eventData.data.killer);
                if (killer) {
                    eventMessage = `died from ${cause} by ${killer.displayName}`;
                } else {
                    eventMessage = `died from ${cause} by unknown killer`;
                }
            } else {
                eventMessage = `died from ${cause}`;
            }

        } else if (eventData.type === 'explosionEvent') {
            const expType = eventData.data.explosionType || 'UNKNOWN';
            eventMessage = `caused an explosion (${expType})`;

        } else if (eventData.type === 'CommandExecuted') {
            const command = eventData.data || 'unknown';
            eventMessage = `executed: /${command}`;

        } else if (eventData.type === 'LoggerStarted') {
            eventMessage = 'Logger started';
            globals?.statsManager.playerDrop.handleServerBootData(eventData.data);
            if (typeof eventData.data?.projectName === 'string' && eventData.data.projectName.length) {
                globals?.persistentCache.set('fxsRuntime:projectName', eventData.data.projectName);
            }

        } else if (eventData.type === 'DebugMessage') {
            eventMessage = (typeof eventData.data === 'string')
                ? `Debug Message: ${eventData.data}`
                : 'Debug Message: unknown';

        } else if (eventData.type === 'MenuEvent') {
            globals?.statsManager.txRuntime.menuCommands.count(eventData.data?.action ?? 'unknown');
            eventMessage = (typeof eventData.data.message === 'string')
                ? `${eventData.data.message}`
                : 'did unknown action';

        } else {
            console.verbose.warn(`Unrecognized event: ${eventData.type}`);
            console.verbose.dir(eventData);
            eventMessage = eventData.type;
        }


        //Prepare output
        const localeTime = new Date(eventData.ts).toLocaleTimeString();
        eventMessage = eventMessage.replace(/\n/g, '\t'); //Just to make sure no event is injecting line breaks
        return {
            eventObject: {
                ts: eventData.ts,
                type: eventData.type,
                src: srcObject,
                msg: eventMessage,
            },
            eventString: `[${localeTime}] ${srcString}: ${eventMessage}`,
        };
    }


    /**
     * Returns a slice of the recent buffer OLDER than a reference timestamp.
     * @param {Number} timestamp
     * @param {Number} sliceLength
     */
    readPartialNewer(timestamp, sliceLength) {
        //FIXME: use d3 bissect to optimize this
        const limitIndex = this.recentBuffer.findIndex((x) => x.ts > timestamp);
        return this.recentBuffer.slice(limitIndex, limitIndex + sliceLength);
    }


    /**
     * Returns a slice of the recent buffer NEWER than a reference timestamp.
     * @param {Number} timestamp
     * @param {Number} sliceLength
     */
    readPartialOlder(timestamp, sliceLength) {
        //FIXME: use d3 bissect to optimize this
        const limitIndex = this.recentBuffer.findIndex((x) => x.ts >= timestamp);

        if (limitIndex === -1) {
            //everything is older, return last few
            return this.recentBuffer.slice(-sliceLength);
        } else {
            //not everything is older
            return this.recentBuffer.slice(Math.max(0, limitIndex - sliceLength), limitIndex);
        }
    }


    /**
     * TODO: filter function, so we can search for all log from a specific player
     */
    readFiltered() {
        throw new Error('Not yet implemented.');
    }
};
