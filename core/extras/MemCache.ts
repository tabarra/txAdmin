import { cloneDeep } from 'lodash-es';

export default class MemCache<T = any> {
    public readonly ttl: number;
    public dataTimestamp: number | undefined;
    private data: T | undefined;

    constructor(ttlSeconds = 60) {
        this.ttl = ttlSeconds * 1000; //converting to ms
    }

    /**
     * Checks if the data is still valid or wipes it
     */
    isValid() {
        if (this.dataTimestamp === undefined) return false;
        if (this.dataTimestamp < Date.now() - this.ttl) {
            this.dataTimestamp = undefined;
            this.data = undefined;
            return false;
        }
        return true;
    }

    /**
     * Sets the cache
     */
    set(data: T) {
        this.dataTimestamp = Date.now();
        this.data = data;
    }

    /**
     * Returns the cache if valid, or undefined
     */
    get() {
        if (this.dataTimestamp === undefined || this.data === undefined) {
            return undefined;
        }

        if (this.isValid()) {
            return cloneDeep<T>(this.data);
        } else {
            return undefined;
        }
    }
};
