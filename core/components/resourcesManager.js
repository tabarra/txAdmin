//Requires
const modulename = 'ResourcesManager';
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);


/*
NOTE Resource load scenarios knowledge base:
- resource lua error:
    - `onResourceStarting` sourceRes
    - print lua error
    - `onResourceStart` sourceRes
- resource lua crash/hang:
    - `onResourceStarting` sourceRes
    - crash/hang
- dependency missing:
    - `onResourceStarting` sourceRes
    - does not get to `onResourceStart`
- dependency success:
    - `onResourceStarting` sourceRes
    - `onResourceStarting` dependency
    - `onResourceStart` dependency
    - `onResourceStart` sourceRes
- webpack/yarn fail:
    - `onResourceStarting` sourceRes
    - does not get to `onResourceStart`
- webpack/yarn success:
    - `onResourceStarting` chat
    - `onResourceStarting` yarn
    - `onResourceStart` yarn
    - `onResourceStarting` webpack
    - `onResourceStart` webpack
    - server first tick
    - wait for build
    - `onResourceStarting` chat
    - `onResourceStart` chat
- ensure started resource:
    - `onResourceStop` sourceRes
    - `onResourceStarting` sourceRes
    - `onResourceStart` sourceRes
    - `onServerResourceStop` sourceRes
    - `onServerResourceStart` sourceRes
*/

module.exports = class DynamicAds {
    constructor() {
        this.activeStartingTime = null;
        this.activeStartingResource = null;
    }


    /**
     * Handler for all txAdminResourceStatus structured trace events
     * @param {*} payload
     */
    handleServerEvents(payload) {
        // log(`${payload.event}: ${payload.resource}`);
        if (payload.event === 'onResourceStarting') {
            this.activeStartingResource = payload.resource;
            this.activeStartingTime = new Date();
        } else if (payload.event === 'onResourceStart') {
            this.activeStartingResource = null;
            this.activeStartingTime = null;
        }
    }


    /**
     * Handler for server restart
     */
    handleServerStop() {
        this.activeStartingResource = null;
        this.activeStartingTime = null;
    }


    /**
     * Handler for server restart
     */
    tmpGetPendingStart() {
        return {
            resname: this.activeStartingResource,
            elapsedSeconds: this.activeStartingTime !== null
                ? Math.round((new Date() - this.activeStartingTime) / 1000)
                : null,
        };
    }
};
