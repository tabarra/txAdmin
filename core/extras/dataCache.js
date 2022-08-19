//Requires
const cloneDeep = require('lodash/cloneDeep');

module.exports = class Cache {
    constructor(cacheTime) {
        this.cacheTime = cacheTime * 1000; //converting to ms
        this.dataTimestamp = null;
        this.data = false;
    }

    /**
     * Sets the cache
     * @param {*} data
     */
    set(data) {
        this.dataTimestamp = Date.now();
        this.data = data;
    }

    /**
     * Returns the cache if valid, or false
     */
    get() {
        const now = Date.now();
        if (now - this.dataTimestamp < this.cacheTime) {
            return cloneDeep(this.data);
        } else {
            return false;
        }
    }
}; //Fim Cache()
