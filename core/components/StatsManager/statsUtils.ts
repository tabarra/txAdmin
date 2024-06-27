import { inspect } from 'node:util';
import CircularBuffer from 'mnemonist/circular-buffer';
import * as d3array from 'd3-array';


//Output types
export type MultipleCounterOutput = Record<string, number>;
export type QuantileArrayOutput = {
    count: number;
    q5: number;
    q25: number;
    q50: number;
    q75: number;
    q95: number;
} | {
    notEnoughData: true;
}; //if less than min size


/**
 * Helper class to count different options
 */
export class MultipleCounter extends Map<string, number> {
    public locked: boolean;
    private _clear: () => void;

    constructor(initialData?: [string, number][] | null | Record<string, number>, locked = false) {
        let initialDataIterable: any;
        if (initialData !== undefined && initialData !== null || typeof initialData === 'object') {
            if (Array.isArray(initialData)) {
                initialDataIterable = initialData;
            } else {
                initialDataIterable = Object.entries(initialData!);
                if (initialDataIterable.some(([k, v]: [string, number]) => typeof k !== 'string' || typeof v !== 'number')) {
                    throw new Error(`Initial data must be an object with only integer values.`)
                }
            }
        }
        super(initialDataIterable ?? initialData);
        this.locked = locked;
        this._clear = super.clear;
    }

    //Clears the counter
    clear() {
        if (this.locked) throw new Error(`This MultipleCounter is locked to modifications.`);
        this._clear();
    };

    //Increments the count of a key by a value
    sum() {
        return [...this.values()].reduce((a, b) => a + b, 0);
    }

    //Increments the count of a key by a value
    count(key: string, val = 1) {
        if (this.locked) throw new Error(`This MultipleCounter is locked to modifications.`);

        const currentValue = this.get(key);
        if (currentValue !== undefined) {
            const newVal = currentValue + val;
            this.set(key, newVal);
            return newVal;
        } else {
            this.set(key, val);
            return val;
        }
    };

    //Merges another counter into this one
    merge(newData: MultipleCounter | [string, number][] | Record<string, number>) {
        if (this.locked) throw new Error(`This MultipleCounter is locked to modifications.`);
        let iterable;
        if (newData instanceof MultipleCounter || Array.isArray(newData)) {
            iterable = newData;
        } else if (typeof newData === 'object' && newData !== null){
            iterable = Object.entries(newData);
        } else {
            throw new Error(`Invalid data type for merge`);
        }
        for (const [key, value] of iterable) {
            this.count(key, value);
        }
    }

    //Returns an array with sorted keys in asc or desc order
    toSortedKeysArray(desc?: boolean) {
        return [...this.entries()]
            .sort((a, b) => desc
                ? b[0].localeCompare(a[0])
                : a[0].localeCompare(b[0])
            );
    }

    // Returns an array with sorted values in asc or desc order
    toSortedValuesArray(desc?: boolean) {
        return [...this.entries()]
            .sort((a, b) => desc ? b[1] - a[1] : a[1] - b[1]);
    }

    //Returns an object with sorted keys in asc or desc order
    toSortedKeyObject(desc?: boolean) {
        return Object.fromEntries(this.toSortedKeysArray(desc));
    }

    //Returns an object with sorted values in asc or desc order
    toSortedValuesObject(desc?: boolean) {
        return Object.fromEntries(this.toSortedValuesArray(desc));
    }

    toArray(): [string, number][] {
        return [...this];
    }

    toJSON(): MultipleCounterOutput {
        return Object.fromEntries(this);
    }

    [inspect.custom]() {
        return this.toSortedKeyObject();
    }
}


/**
 * Helper calculate quantiles out of a circular buffer of numbers
 */
export class QuantileArray {
    readonly #cache: CircularBuffer<number>;
    readonly #minSize: number;

    constructor(sizeLimit: number, minSize = 1) {
        if (typeof sizeLimit !== 'number' || !Number.isInteger(sizeLimit) || sizeLimit < 1) {
            throw new Error(`sizeLimit must be a positive integer over 1.`);
        }
        if (typeof minSize !== 'number' || !Number.isInteger(minSize) || minSize < 1) {
            throw new Error(`minSize must be a positive integer or one.`);
        }
        this.#cache = new CircularBuffer(Array, sizeLimit);
        this.#minSize = minSize;
    }

    /**
     * Clears the cached data (wipe counts).
     */
    clear() {
        this.#cache.clear();
    };

    /**
     * Adds a value to the cache.
     */
    count(value: number) {
        if (typeof value !== 'number') throw new Error(`value must be a number`);
        this.#cache.push(value);
    };

    /**
     * Processes the cache and returns the count and quantiles, if enough data.
     */
    result(): QuantileArrayOutput {
        const cacheSize = this.#cache.size
        if (cacheSize < this.#minSize) {
            return {
                notEnoughData: true,
            }
        } else {
            return {
                count: cacheSize,
                q5: d3array.quantile(this.#cache.values(), 0.05) as number,
                q25: d3array.quantile(this.#cache.values(), 0.25) as number,
                q50: d3array.quantile(this.#cache.values(), 0.50) as number,
                q75: d3array.quantile(this.#cache.values(), 0.75) as number,
                q95: d3array.quantile(this.#cache.values(), 0.95) as number,
            };
        }
    }

    toJSON() {
        return this.result();
    }

    [inspect.custom]() {
        return this.result();
    }
}


/**
 * Helper class to count time durations and convert them to human readable values
 */
export class TimeCounter {
    readonly #timeStart: bigint;
    #timeEnd: bigint | undefined;
    public duration: {
        nanoseconds: number
        milliseconds: number,
        seconds: number,
    } | undefined;

    constructor() {
        this.#timeStart = process.hrtime.bigint();
    }

    stop() {
        this.#timeEnd = process.hrtime.bigint();
        const nanoseconds = this.#timeEnd - this.#timeStart;
        const asNumber = Number(nanoseconds);
        this.duration = {
            nanoseconds: asNumber,
            seconds: asNumber / 1_000_000_000,
            milliseconds: asNumber / 1_000_000,
        };
        return this.duration;
    };

    toJSON() {
        return this.duration;
    }

    [inspect.custom]() {
        return this.toJSON();
    }
}
