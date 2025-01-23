//@ts-nocheck
import { test, expect, suite, it } from 'vitest';
import { 
    MultipleCounter,
    QuantileArray,
    TimeCounter,
    estimateArrayJsonSize,
    isWithinMargin,
} from './statsUtils';


suite('MultipleCounter', () => {
    it('should instantiate empty correctly', () => {
        const counter = new MultipleCounter();
        expect(counter).toBeInstanceOf(MultipleCounter);
        expect(counter.toArray()).toEqual([]);
        expect(counter.toJSON()).toEqual({});
    });

    it('should instantiate locked if specified', () => {
        const lockedCounter = new MultipleCounter(undefined, true);
        expect(() => lockedCounter.count('a')).toThrowError('is locked');
        expect(() => lockedCounter.clear()).toThrowError('is locked');
    });

    it('should handle instantiation data error', () => {
        expect(() => new MultipleCounter({ a: 'b' as any })).toThrowError('only integer');
    });

    const counterWithData = new MultipleCounter({ a: 1, b: 2 });
    it('should instantiate with object correctly', () => {
        expect(counterWithData.toArray()).toEqual([['a', 1], ['b', 2]]);
        expect(counterWithData.toJSON()).toEqual({ a: 1, b: 2 });
    });
    it('should count and clear', () => {
        counterWithData.count('a');
        expect(counterWithData.toJSON()).toEqual({ a: 2, b: 2 });
        counterWithData.count('b');
        counterWithData.count('c', 5);
        expect(counterWithData.toJSON()).toEqual({ a: 2, b: 3, c: 5 });
        counterWithData.clear();
        expect(counterWithData.toJSON()).toEqual({});
    });

    it('should sort the data', () => {
        const counter = new MultipleCounter({ a: 3, z: 1, c: 2 });
        expect(counter.toSortedKeyObject()).toEqual({ a: 3, c: 2, z: 1 });
        expect(counter.toSortedKeyObject(true)).toEqual({ z: 1, c: 2, a: 3 });
        expect(counter.toSortedValuesObject()).toEqual({ a: 3, c: 2, z: 1 });
        expect(counter.toSortedValuesObject(true)).toEqual({ z: 1, c: 2, a: 3 });
        expect(counter.toSortedKeysArray()).toEqual([['a', 3], ['c', 2], ['z', 1]]);
        expect(counter.toSortedKeysArray(true)).toEqual([['z', 1], ['c', 2], ['a', 3]]);
        expect(counter.toSortedValuesArray()).toEqual([['z', 1], ['c', 2], ['a', 3]]);
        expect(counter.toSortedValuesArray(true)).toEqual([['a', 3], ['c', 2], ['z', 1]]);
    });

    suite('should handle merging counters', () => {
        it('with another counter', () => {
            const ogCounter = new MultipleCounter({ a: 1, b: 2 });
            const newCounter = new MultipleCounter({ b: 3, c: 4 });
            ogCounter.merge(newCounter);
            expect(ogCounter.toJSON()).toEqual({ a: 1, b: 5, c: 4 });
        });
        it('with an array', () => {
            const ogCounter = new MultipleCounter({ a: 1, b: 2 });
            ogCounter.merge([['b', 3], ['c', 4]]);
            expect(ogCounter.toJSON()).toEqual({ a: 1, b: 5, c: 4 });
        });
        it('with an object', () => {
            const ogCounter = new MultipleCounter({ a: 1, b: 2 });
            ogCounter.merge({ b: 3, c: 4 });
            expect(ogCounter.toJSON()).toEqual({ a: 1, b: 5, c: 4 });
        });
        it('with invalid data', () => {
            const ogCounter = new MultipleCounter();
            expect(() => ogCounter.merge('a' as any)).toThrowError('Invalid data type for merge');
        });
    });
});


suite('QuantileArray', () => {
    const array = new QuantileArray(4, 2);
    test('min data', () => {
        array.count(0);
        expect(array.result()).toEqual({ enoughData: false });
    });
    test('zeros only', () => {
        array.count(0);
        array.count(0);
        array.count(0);
        expect(array.result()).toEqual({
            enoughData: true,
            count: 4,
            p5: 0,
            p25: 0,
            p50: 0,
            p75: 0,
            p95: 0,
        });
    });
    const repeatedExpectedResult = {
        enoughData: true,
        count: 4,
        p5: 0,
        p25: 0,
        p50: 0.5,
        p75: 1,
        p95: 1,
    }
    test('calc quantile', () => {
        array.count(1);
        array.count(1);
        expect(array.result()).toEqual(repeatedExpectedResult);
    });
    test('summary', () => {
        expect(array.resultSummary('ms')).toEqual({
            ...repeatedExpectedResult,
            summary: '(4) p5:0ms/p25:0ms/p50:1ms/p75:1ms/p95:1ms',
        });
        expect(array.resultSummary()).toEqual({
            ...repeatedExpectedResult,
            summary: '(4) p5:0/p25:0/p50:1/p75:1/p95:1',
        });
    });
    test('clear', () => {
        array.clear();
        expect(array.result()).toEqual({ enoughData: false });
        expect(array.resultSummary()).toEqual({
            enoughData: false,
            summary: 'not enough data available',
        });
    });
});


suite('TimeCounter', async () => {
    const counter = new TimeCounter();
    await new Promise((resolve) => setTimeout(resolve, 150));
    const duration = counter.stop();

    // Check if the duration is a valid object
    test('duration is valid', () => {
        expect(duration.seconds).toBeTypeOf('number');
        expect(duration.milliseconds).toBeTypeOf('number');
        expect(duration.nanoseconds).toBeTypeOf('number');
        expect(counter.toJSON()).toEqual(duration);
    });

    // Check if the duration is within the expected range
    test('duration within range', () => {
        const isCloseTo50ms = (x: number) => (x > 150 && x < 175);
        expect(duration.seconds * 1000).toSatisfy(isCloseTo50ms);
        expect(duration.milliseconds).toSatisfy(isCloseTo50ms);
        expect(duration.nanoseconds / 1_000_000).toSatisfy(isCloseTo50ms);
    });
});


suite('estimateArrayJsonSize', () => {
    test('obeys minimas', () => {
        const result = estimateArrayJsonSize([], 1);
        expect(result).toEqual({ enoughData: false });

        const result2 = estimateArrayJsonSize([1], 2);
        expect(result2).toEqual({ enoughData: false });
    });

    test('calculates size correctly', () => {
        const array = Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `value${i}` }));
        const realFullSize = JSON.stringify(array).length;
        const realElementSize = realFullSize / array.length;
        const result = estimateArrayJsonSize(array, 100);
        expect(result.enoughData).toBe(true);
        expect(result.bytesTotal).toSatisfy((x: number) => isWithinMargin(x, realFullSize, 0.1));
        expect(result.bytesPerElement).toSatisfy((x: number) => isWithinMargin(x, realElementSize, 0.1));
    });

    test('handles small arrays', () => {
        const array = [{ id: 1, value: 'value1' }];
        const result = estimateArrayJsonSize(array, 0);
        expect(result.enoughData).toBe(true);
        expect(result.bytesTotal).toBeGreaterThan(0);
        expect(result.bytesTotal).toBeLessThan(100);
        expect(result.bytesPerElement).toBeGreaterThan(0);
        expect(result.bytesTotal).toBeLessThan(100);
    });

    test('handles large arrays', () => {
        const array = Array.from({ length: 20000 }, (_, i) => ({ id: i, value: `value${i}` }));
        const realFullSize = JSON.stringify(array).length;
        const realElementSize = realFullSize / array.length;
        const result = estimateArrayJsonSize(array, 100);
        expect(result.enoughData).toBe(true);
        expect(result.bytesTotal).toSatisfy((x: number) => isWithinMargin(x, realFullSize, 0.1));
        expect(result.bytesPerElement).toSatisfy((x: number) => isWithinMargin(x, realElementSize, 0.1));
    });
});
