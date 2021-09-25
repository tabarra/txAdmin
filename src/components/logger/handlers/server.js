/* eslint-disable padded-blocks */
//Requires
const modulename = 'Logger:Server';
const { dir, log, logOk, logWarn, logError } = require('../../../extras/console')(modulename);
const { LoggerBase, separator } = require('../loggerUtils');

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


FIXME: after testing, I could not reproduce just with log array the memory leak numbers seen in issues.
Investigate if there are other memory leaks, or maybe if the array.concat(payload) is the issue
To match the issue on issue #427, we would need 300k events to be a 470mb increase in rss and I
measured only 94mb worst case scenario

TODO: maybe a way to let big servers filter what is logged or not? That would be an export in fxs,
before sending it to fd3
*/

module.exports = class ServerLogger extends LoggerBase {
    constructor(basePath, lrProfileConfig) {
        const lrDefaultOptions = {
            path: basePath,
            intervalBoundary: true,
            initialRotation: true,
            history: 'server.history',
            // compress: 'gzip', //don't forget to do `mv filename filename.gz`
            interval: '1d',
            maxFiles: 7,
            maxSize: '10G',

        };
        super(basePath, 'server', lrDefaultOptions, lrProfileConfig);
        this.lrStream.write(`\n${separator('txAdmin Starting')}\n`);
        this.lrStream.on('rotated', (filename) => {
            this.lrStream.write(`\n${separator('Log Rotated')}\n`);
            if (GlobalData.verbose) log(`Rotated file ${filename}`);
        });


        this.recentBuffer = [];
        this.recentBufferMaxSize = 32e3;
        this.cachedPlayers = new Map(); //TODO: maybe move to playerController in the future
    }


    /**
     * Returns a string with short usage stats
     */
    getUsageStats() {
        // include this.cachedPlayers.size
        // calculate events per minute moving average 10 && peak
        return `Errors: ${this.lrErrors}`;
    }


    /***
     * Returns the recent fxserver buffer containing HTML markers, and not XSS escaped.
     * The size of this buffer is usually above 64kb, never above 128kb.
     */
    getRecentBuffer() {
        return this.recentBuffer;
    }


    /**
     * Processes the FD3 log array
     * @param {String} mutex
     * @param {Array} data
     */
    write(mutex, data) {
        if (!Array.isArray(data)) {
            if (GlobalData.verbose) logWarn(`write() expected array, got ${typeof data}`);
            return false;
        }

        //Processing events
        for (let i = 0; i < data.length; i++) {
            logError(`loop ${i}:`);
            // dir(data[i]); //DEBUG
            // continue;
            try {
                const {eventObject, eventString} = this.processEvent(mutex, data[i]);
                // dir({eventObject, eventString});
                if (!eventObject || !eventString) {
                    if (GlobalData.verbose) {
                        logWarn('Failed to parse event:');
                        dir(data[i]);
                    }
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
                if (GlobalData.verbose) {
                    logError('Error processing FD3 txAdminLogData:');
                    dir(error);
                }
            }
        }
    }

    /**
     * Processes an event and returns both the string for log file, and object for the web ui
     * @param {String} mutex
     * @param {Object} eventData
     */
    processEvent(mutex, eventData) {
        //Get source + handle playerJoining
        let srcObject, srcString, eventMessage;
        if (eventData.src === 'tx') {
            srcObject = {id: false, name: 'txAdmin'};
            srcString = 'txAdmin';

        } else if (typeof eventData.src === 0) {
            srcObject = {id: false, name: 'CONSOLE'};
            srcString = 'CONSOLE';

        } else if (typeof eventData.src === 'number' && eventData.src > 0) {
            const playerID = `${mutex}#${eventData.src}`;
            let playerData = this.cachedPlayers.get(playerID);
            if (playerData) {
                srcObject = {id: playerID, name: playerData.name};
                srcString = `[${playerID}] ${playerData.name}`;
            } else {
                if (eventData.type === 'playerJoining') {
                    if (eventData.data.name && Array.isArray(eventData.data.ids)) {
                        playerData = eventData.data;
                        playerData.ids = playerData.ids.filter((id) => !id.startsWith('ip:'));
                        this.cachedPlayers.set(playerID, playerData);
                        srcObject = {id: playerID, name: playerData.name};
                        srcString = `[${playerID}] ${playerData.name}`;
                        eventMessage = `joined with identifiers [${playerData.ids.join('; ')};]`;
                    } else {
                        srcObject = {id: false, name: 'UNKNOWN PLAYER'};
                        srcString = 'UNKNOWN PLAYER';
                        eventMessage = 'joined with unknown identifiers.';
                        if (GlobalData.verbose) {
                            logWarn('playerJoining: Unknown numeric event source from object:');
                            dir(eventData);
                        }
                    }
                } else {
                    srcObject = {id: false, name: 'UNKNOWN PLAYER'};
                    srcString = 'UNKNOWN PLAYER';
                    if (GlobalData.verbose) {
                        logWarn('Unknown numeric event source from object:');
                        dir(eventData);
                    }
                }
            }

        } else {
            srcObject = {id: false, name: 'UNKNOWN'};
            srcString = 'UNKNOWN';
        }


        //Process event types (except playerJoining)
        //TODO: normalize/padronize actions
        if (eventData.type === 'playerDropped') {
            eventMessage = 'disconnected';

        } else if (eventData.type === 'ChatMessage') {
            const text = (typeof eventData.data.text === 'string') ? eventData.data.text.replace(/\^([0-9])/g, '') : 'unknown message';
            eventMessage = (typeof eventData.data.author === 'string' && eventData.data.author !== srcObject.name)
                ? `(${eventData.data.author}): said "${text}"`
                : `said "${text}"`;

        } else if (eventData.type === 'DeathNotice') {
            const cause = eventData.data.cause || 'unknown';
            if (typeof eventData.data.killer === 'number' && eventData.data.killer > 0) {
                const killer = this.cachedPlayers.get(`${mutex}#${eventData.data.killer}`);
                if (killer) {
                    eventMessage = `died from ${cause} by ${killer.name}`;
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

        } else if (eventData.type === 'txAdminClient:Started') { //DONE
            eventMessage = 'Logger started';

        } else if (eventData.type === 'DebugMessage') {
            eventMessage = (typeof eventData.data === 'string')
                ? `Debug Message: ${eventData.data}`
                : 'Debug Message: unknown';

        } else if (eventData.type === 'MenuEvent') {
            eventMessage = (typeof eventData.data === 'string')
                ? `${eventData.data}`
                : 'did unknown action';

        } else if (eventData.type !== 'playerJoining') {
            if (GlobalData.verbose) {
                logWarn(`Unrecognized event: ${eventData.type}`);
                dir(eventData);
            }
            eventMessage = eventData.type;
        }


        //Prepare output
        const localeTime = new Date(eventData.ts).toLocaleTimeString();
        eventMessage = eventMessage.replace(/\n/g, '\t'); //Just to make sure no event is injecting line breaks
        return {
            eventObject: {
                ts: eventData.ts,
                src: srcObject,
                msg: eventMessage,
            },
            eventString: `[${localeTime}] ${srcString}: ${eventMessage}`,
        };
    }


    /**
     * FIXME: ???
     * @param {*} timestamp
     * @param {*} sliceLength
     * @returns
     */
    readPartialNewer(timestamp, sliceLength) {
        throw new Error('Not yet implemented.');

        const limitIndex = source.findIndex((x) => x.ts > timestamp);
        return events.slice(limitIndex, limitIndex + sliceLength);
    }


    /**
     * FIXME: ???
     * @param {*} timestamp
     * @param {*} sliceLength
     * @returns
     */
    readPartialOlder(timestamp, sliceLength) {
        throw new Error('Not yet implemented.');

        const limitIndex = source.findIndex((x) => x.ts >= timestamp);

        //everything is older, return last few
        if (limitIndex === -1) {
            return events.slice(-sliceLength);

        //not everything is older
        } else {
            return events.slice(Math.max(0, limitIndex - sliceLength), limitIndex);
        }
    }


    /**
     * FIXME: ???
     */
    readFiltered() {
        throw new Error('Not yet implemented.');
    }
};
