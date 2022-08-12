//Requires
const modulename = 'ResourcesManager';
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);


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
