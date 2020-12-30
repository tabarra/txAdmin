//Requires
const cloneDeep = require('lodash/cloneDeep');

module.exports = class Cache {
    constructor(cacheTime) {
        this.cacheTime = cacheTime;
        this.dataTimestamp = null;
        this.data = false;
    }

    /**
     * Sets the cache
     * @param {*} data
     */
    set(data){
        this.dataTimestamp = Math.round(Date.now() / 1000);
        this.data = data;
    }

    /**
     * Returns the cache if valid, or false
     */
    get(){
        const now = Math.round(Date.now() / 1000);
        if(now - this.dataTimestamp < this.cacheTime){
            return cloneDeep(this.data);
        }else{
            return false;
        }
    }
} //Fim Cache()
