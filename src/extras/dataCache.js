//Requires
const clone = require('clone');

module.exports = class Cache {
    constructor(cacheTime) {
        this.cacheTime = cacheTime;
        this.dataTimestamp = null;
        this.data = false;
    }


    //================================================================
    /**
     * Sets the cache
     * @param {string} data
     */
    set(data){
        this.dataTimestamp = (new Date()/1000).toFixed();
        this.data = data;
    }


    //================================================================
    /**
     * Returns the cache if valid, or false
     */
    get(){
        let now = (new Date()/1000).toFixed();
        if(now - this.dataTimestamp < this.cacheTime){
            return clone(this.data);
        }else{
            return false;
        }
    }


} //Fim Cache()
