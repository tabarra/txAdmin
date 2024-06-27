const modulename = 'PersistentCache';
import fsp from 'node:fs/promises';
import TxAdmin from '@core/txAdmin';
import throttle from 'lodash-es/throttle.js';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);


//NOTE: due to limitations on how we compare value changes we can only accept these types
//This is to prevent saving the same value repeatedly (eg sv_maxClients every 3 seconds)
type AcceptedCachedTypes = string | boolean | number | null;
const isAcceptedType = (val: any) => {
    const valType = typeof val;
    return (val === null || valType === 'string' || valType === 'boolean' || valType === 'number');
}


/**
 * Dead-simple Map-based persistent cache, saved in txData/<profile>/cachedData.json.
 * This is not meant to store anything super important, the async save does not throw in case of failure,
 * and it will reset the cache in case it fails to load.
 */
export default class PersistentCache {
    #txAdmin: TxAdmin;
    #cache: Map<string, AcceptedCachedTypes> | undefined;
    readonly cacheFilePath: string;
    readonly throttledSaveCache: Function;

    constructor(txAdmin: TxAdmin) {
        this.#txAdmin = txAdmin;
        this.cacheFilePath = `${txAdmin.info.serverProfilePath}/data/cachedData.json`;
        this.throttledSaveCache = throttle(
            this.saveCache.bind(this),
            5000,
            { leading: false, trailing: true }
        );
        this.loadCachedData();
    }

    isReady() {
        return this.#cache instanceof Map;
    }

    has(key: string) {
        if (!(this.#cache instanceof Map)) return false;
        return this.#cache.has(key);
    }

    get(key: string) {
        if (!(this.#cache instanceof Map)) return undefined;
        return this.#cache.get(key);
    }

    set(key: string, value: AcceptedCachedTypes) {
        if (!(this.#cache instanceof Map)) return false;
        if (!isAcceptedType(value)) throw new Error(`Value of type ${typeof value} is not acceptable.`);
        const currValue = this.#cache.get(key);
        if (currValue !== value) {
            this.#cache.set(key, value);
            this.throttledSaveCache();
        }
        return true;
    }

    delete(key: string) {
        if (!(this.#cache instanceof Map)) return false;
        const deleteResult = this.#cache.delete(key);
        this.throttledSaveCache();
        return deleteResult;
    }

    async saveCache() {
        if (!(this.#cache instanceof Map)) return false;
        try {
            const toSave = JSON.stringify([...this.#cache.entries()]);
            // console.debug('Saving:', toSave)
            await fsp.writeFile(this.cacheFilePath, toSave);
            // console.debug('Finished saving:', toSave)
            console.verbose.debug(`Saved cachedData.json with ${this.#cache.size} entries.`);
        } catch (error) {
            console.error(`Unable to save cachedData.json with error: ${(error as Error).message}`);
        }
    }

    async loadCachedData() {
        let rawFile = null;
        try {
            rawFile = await fsp.readFile(this.cacheFilePath, 'utf8');
        } catch (error) { }

        const resetCacheFile = async () => {
            try {
                await fsp.writeFile(this.cacheFilePath, '[]');
                this.#cache = new Map();
                console.verbose.warn(`Reset cachedData.json.`);
            } catch (error) {
                console.error(`Unable to create cachedData.json with error: ${(error as Error).message}`);
            }
        };

        if (rawFile === null) {
            await resetCacheFile();
        } else {
            try {
                const fileData = JSON.parse(rawFile);
                if (!Array.isArray(fileData)) throw new Error('data is not an array');
                this.#cache = new Map(fileData);
                console.verbose.ok(`Loaded cachedData.json with ${this.#cache.size} entries.`);
            } catch (error) {
                console.warn(`Failed to load cachedData.json with message: ${(error as Error).message}`);
                console.warn('Since this is not a critical file, it will be reset.');
                await resetCacheFile();
            }
        }
    }
};
