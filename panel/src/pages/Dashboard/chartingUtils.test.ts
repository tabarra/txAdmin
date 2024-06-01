import { expect, suite, it } from 'vitest';
import { formatTickBoundary, getMinTickIntervalMarker } from './chartingUtils';

suite('getMinTickIntervalMarker', () => {
    it('should return undefined when boundaries array is empty', () => {
        const result = getMinTickIntervalMarker([], 10);
        expect(result).toBeUndefined();
    });

    it('should return undefined when no boundary is less than or equal to minTickInterval', () => {
        const result = getMinTickIntervalMarker([20, 30, 40], 10);
        expect(result).toBeUndefined();
    });

    it('should return the last boundary that is less than or equal to minTickInterval', () => {
        let result = getMinTickIntervalMarker([5, 10, 15], 10);
        expect(result).toBe(10);

        result = getMinTickIntervalMarker([5, 10, 15], 11);
        expect(result).toBe(10);
    });

    it('should stop at first string', () => {
        const result = getMinTickIntervalMarker([5, '+Inf', 15], 10);
        expect(result).toBeUndefined();
    });

    it('should not find any if above all except infinity', () => {
        const result = getMinTickIntervalMarker([5, 10, 15, '+Inf'], 20);
        expect(result).toBeUndefined();
    });
});


suite('formatTickBoundary', () => {
    it('should return "+Inf" when input is "+Inf"', () => {
        const result = formatTickBoundary('+Inf');
        expect(result).toBe('+Inf');
    });

    it('should handle negative numbers', () => {
        const result = formatTickBoundary(-50);
        expect(result).toBe('<0 ms');
    });

    it('should handle 0', () => {
        const result = formatTickBoundary(0);
        expect(result).toBe('0 ms');
    });

    it('should return "???" when input is a string that is not "+Inf"', () => {
        const result = formatTickBoundary('notInf');
        expect(result).toBe('???');
    });

    it('should return "<1 ms" when input is a number less than 0.001', () => {
        const result = formatTickBoundary(0.0009);
        expect(result).toBe('<1 ms');
    });

    it('should return the number in milliseconds when input is a number between 0.001 and 1', () => {
        const result = formatTickBoundary(0.5);
        expect(result).toBe('500 ms');
    });

    it('should deal with values >= 1 second', () => {
        let result = formatTickBoundary(1);
        expect(result).toBe('1 s');

        result = formatTickBoundary(1.234);
        expect(result).toBe('1.23 s');

        result = formatTickBoundary(1.239);
        expect(result).toBe('1.24 s');
        
        result = formatTickBoundary(150);
        expect(result).toBe('150 s');
    });
});
