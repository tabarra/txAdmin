import { test, expect, suite, it } from 'vitest';
import { MultipleCounter, QuantileArray, TimeCounter } from './statsUtils';


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


test('QuantileArray', () => {
    const array = new QuantileArray(4, 2);
    array.count(0);
    expect(array.result()).toEqual({ notEnoughData: true });
    array.count(0);
    array.count(0);
    array.count(0);
    expect(array.result()).toEqual({
        count: 4,
        q5: 0,
        q25: 0,
        q50: 0,
        q75: 0,
        q95: 0,
    });

    array.count(1);
    array.count(1);
    expect(array.result()).toEqual({
        count: 4,
        q5: 0,
        q25: 0,
        q50: 0.5,
        q75: 1,
        q95: 1,
    });

    array.clear();
    expect(array.result()).toEqual({ notEnoughData: true });
});


test('TimeCounter', async () => {
    const counter = new TimeCounter();
    await new Promise((resolve) => setTimeout(resolve, 150));
    const duration = counter.stop();

    // Check if the duration is a valid object
    expect(duration.seconds).toBeTypeOf('number');
    expect(duration.milliseconds).toBeTypeOf('number');
    expect(duration.nanoseconds).toBeTypeOf('number');
    expect(counter.toJSON()).toEqual(duration);

    // Check if the duration is within the expected range
    const isCloseTo50ms = (x: number) => (x > 150 && x < 175);
    expect(duration.seconds * 1000).toSatisfy(isCloseTo50ms);
    expect(duration.milliseconds).toSatisfy(isCloseTo50ms);
    expect(duration.nanoseconds / 1_000_000).toSatisfy(isCloseTo50ms);
});
