const modulename = 'CacheStore';
import fsp from 'node:fs/promises';
import throttle from 'lodash-es/throttle.js';
import consoleFactory from '@lib/console';
import { txDevEnv, txEnv } from '@core/globalData';
import type { z, ZodSchema } from 'zod';
import type { UpdateConfigKeySet } from './ConfigStore/utils';
const console = consoleFactory(modulename);


//NOTE: due to limitations on how we compare value changes we can only accept these types
//This is to prevent saving the same value repeatedly (eg sv_maxClients every 3 seconds)
export const isBoolean = (val: any): val is boolean => typeof val === 'boolean';
export const isNull = (val: any): val is null => val === null;
export const isNumber = (val: any): val is number => typeof val === 'number';
export const isString = (val: any): val is string => typeof val === 'string';
type IsTypeFunctions = typeof isBoolean | typeof isNull | typeof isNumber | typeof isString;
type InferValType<T> = T extends (val: any) => val is infer R ? R : never;
type AcceptedCachedTypes = boolean | null | number | string;
type CacheMap = Map<string, AcceptedCachedTypes>;
const isAcceptedType = (val: any): val is AcceptedCachedTypes => {
    const valType = typeof val;
    return (val === null || valType === 'string' || valType === 'boolean' || valType === 'number');
}

const CACHE_FILE_NAME = 'cachedData.json';


/**
 * Dead-simple Map-based persistent cache, saved in txData/<profile>/cachedData.json.  
 * This is not meant to store anything super important, the async save does not throw in case of failure,
 * and it will reset the cache in case it fails to load.
 */
export default class CacheStore {
    static readonly configKeysWatched = [
        'server.dataPath',
        'server.cfgPath',
    ];

    private cache: CacheMap = new Map();
    readonly cacheFilePath = `${txEnv.profilePath}/data/${CACHE_FILE_NAME}`;
    readonly throttledSaveCache = throttle(
        this.saveCache.bind(this),
        5000,
        { leading: false, trailing: true }
    );

    constructor() {
        this.loadCachedData();

        //TODO: handle shutdown? copied from Metrics.svRuntime
        // this.throttledSaveCache.cancel({ upcomingOnly: true });
        // this.saveCache();
    }

    //Resets the fxsRuntime cache on server reset
    public handleConfigUpdate(updatedConfigs: UpdateConfigKeySet) {
        this.delete('fxsRuntime:gameName'); //from logger
        this.delete('fxsRuntime:cfxId'); //from fd3
        this.delete('fxsRuntime:maxClients'); //from /dynamic.json

        //from /info.json
        this.delete('fxsRuntime:bannerConnecting');
        this.delete('fxsRuntime:bannerDetail');
        this.delete('fxsRuntime:iconFilename');
        this.delete('fxsRuntime:locale');
        this.delete('fxsRuntime:projectDesc');
        this.delete('fxsRuntime:projectName');
        this.delete('fxsRuntime:tags');
    }

    public has(key: string) {
        return this.cache.has(key);
    }

    public get(key: string) {
        return this.cache.get(key);
    }

    public getTyped<T extends IsTypeFunctions>(key: string, typeChecker: T) {
        const value = this.cache.get(key);
        if (!value) return undefined;
        if (typeChecker(value)) return value as InferValType<T>;
        return undefined;
    }

    public set(key: string, value: AcceptedCachedTypes) {
        if (!isAcceptedType(value)) throw new Error(`Value of type ${typeof value} is not acceptable.`);
        const currValue = this.cache.get(key);
        if (currValue !== value) {
            this.cache.set(key, value);
            this.throttledSaveCache();
        }
    }

    public upsert(key: string, value: AcceptedCachedTypes | undefined) {
        if (value === undefined) {
            this.delete(key);
        } else {
            this.set(key, value);
        }
    }

    public delete(key: string) {
        const deleteResult = this.cache.delete(key);
        this.throttledSaveCache();
        return deleteResult;
    }

    private async saveCache() {
        try {
            const serializer = (txDevEnv.ENABLED)
                ? (obj: any) => JSON.stringify(obj, null, 4)
                : JSON.stringify
            const toSave = serializer([...this.cache.entries()]);
            await fsp.writeFile(this.cacheFilePath, toSave);
            // console.verbose.debug(`Saved ${CACHE_FILE_NAME} with ${this.cache.size} entries.`);
        } catch (error) {
            console.error(`Unable to save ${CACHE_FILE_NAME} with error: ${(error as Error).message}`);
        }
    }

    private async loadCachedData() {
        try {
            const rawFileData = await fsp.readFile(this.cacheFilePath, 'utf8');
            const fileData = JSON.parse(rawFileData);
            if (!Array.isArray(fileData)) throw new Error('data_is_not_an_array');
            this.cache = new Map(fileData);
            console.verbose.ok(`Loaded ${CACHE_FILE_NAME} with ${this.cache.size} entries.`);
        } catch (error) {
            this.cache = new Map();
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
