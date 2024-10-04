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

const CACHE_FILE_NAME = 'cachedData.json';

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
        this.cacheFilePath = `${txAdmin.info.serverProfilePath}/data/${CACHE_FILE_NAME}`;
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
            console.verbose.debug(`Saved ${CACHE_FILE_NAME} with ${this.#cache.size} entries.`);
        } catch (error) {
            console.error(`Unable to save ${CACHE_FILE_NAME} with error: ${(error as Error).message}`);
        }
    }

    async loadCachedData() {
        try {
            const rawFileData = await fsp.readFile(this.cacheFilePath, 'utf8');
            const fileData = JSON.parse(rawFileData);
            if (!Array.isArray(fileData)) throw new Error('data_is_not_an_array');
            this.#cache = new Map(fileData);
            console.verbose.ok(`Loaded ${CACHE_FILE_NAME} with ${this.#cache.size} entries.`);
        } catch (error) {
            this.#cache = new Map();
            if ((error as any)?.code === 'ENOENT') {
                console.verbose.debug(`${CACHE_FILE_NAME} not found, making a new one.`);
            } else if ((error as any)?.message === 'data_is_not_an_array') {
                console.warn(`Failed to load ${CACHE_FILE_NAME} due to invalid data.`);
                console.warn('Since this is not a critical file, it will be reset.');
            } else {
                console.warn(`Failed to load ${CACHE_FILE_NAME} with message: ${(error as any).message}`);
                console.warn('Since this is not a critical file, it will be reset.');
            }
        }
    }
};
