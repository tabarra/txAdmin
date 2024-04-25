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
export class MultipleCounter {
    #data = new Map<string, number>();
    #locked: boolean;

    constructor(initialData?: Record<string, number>, locked = false) {
        this.#locked = locked;

        if (initialData !== undefined) {
            if (initialData === null || typeof initialData !== 'object') {
                throw new Error(`initialData must be an iterable object.`);
            }
            for (const [key, val] of Object.entries(initialData)) {
                if (typeof val !== 'number' || !Number.isInteger(val)) {
                    throw new Error(`initialData objects must map only integer values.`);
                }
                this.#data.set(key, val);
            }
        }
    }

    clear() {
        if (this.#locked) throw new Error(`This MultipleCounter is locked to modifications.`);
        this.#data.clear();
    };

    count(key: string, val = 1) {
        if (this.#locked) throw new Error(`This MultipleCounter is locked to modifications.`);

        const currentValue = this.#data.get(key);
        if (currentValue !== undefined) {
            const newVal = currentValue + val;
            this.#data.set(key, newVal);
            return newVal;
        } else {
            this.#data.set(key, val);
            return val;
        }
    };

    toArray(): [string, number][] {
        return [...this.#data];
    }

    toJSON(): MultipleCounterOutput {
        return Object.fromEntries(this.#data);
    }

    [inspect.custom]() {
        return this.toJSON();
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
