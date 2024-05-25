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

    it('handle instantiation data error', () => {
        expect(() => new MultipleCounter(null as any)).toThrowError('must be an iterable');
        expect(() => new MultipleCounter({ a: 'b' as any })).toThrowError('only integer');
    });

    const counterWithData = new MultipleCounter({ a: 1, b: 2 });
    it('should instantiate with data correctly', () => {
        expect(counterWithData.toArray()).toEqual([['a', 1], ['b', 2]]);
        expect(counterWithData.toJSON()).toEqual({ a: 1, b: 2 });
    });
    it('should count and clear', () => {
        counterWithData.count('a');
        expect(counterWithData.toJSON()).toEqual({ a: 2, b: 2 });
        counterWithData.count('b');
        counterWithData.count('c', 5);
        expect(counterWithData.toJSON()).toEqual({ a: 2, b: 3, c: 5});
        counterWithData.clear();
        expect(counterWithData.toJSON()).toEqual({});
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
