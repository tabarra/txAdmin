//Requires
const modulename = 'Logger:Server';
const { dir, log, logOk, logWarn, logError } = require('../../../extras/console')(modulename);
const { LoggerBase, separator } = require('../loggerUtils');
// const xss = require('../../extras/xss')({mark:['class']}); //FIXME: NEEDED?

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
        this.lrStream.on('rotated', (filename) => {
            this.lrStream.write(`\n${separator('Log Rotated')}\n`);
            if (GlobalData.verbose) log(`Rotated file ${filename}`);
        });


        this.recentBuffer = [];
        this.recentBufferMaxSize = 32e3;
    }


    /**
     * Returns a string with short usage stats
     */
    getUsageStats() {
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
     * @param {Array} data
     */
    write(data) {
        if (!Array.isArray(data)) {
            if (GlobalData.verbose) logWarn(`write() expected array, got ${typeof data}`);
            return false;
        }

        //Processing events
        for (let i = 0; i < data.length; i++) {
            const {eventObject, eventString} = this.processEvent(data[i]);
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
            this.lrStream.write(eventString);
        }
    }

    /**
     *
     * @param {Object} data
     */
    processEvent(data) {
        return {
            eventObject: data,
            eventString: 'xxxxx',
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
