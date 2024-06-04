import { expect, suite, it } from 'vitest';
import type { SvRtLogType, SvRtPerfHistType } from "@shared/otherTypes";
import { formatTickBoundary, getBucketTicketsEstimatedTime, getMinTickIntervalMarker, getTimeWeightedHistogram, splitLogIntoLifespans } from './chartingUtils';


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

    it('should detect if got to infinite without finding the threshold', () => {
        const result = getMinTickIntervalMarker([5, '+Inf'], 10);
        expect(result).toBeUndefined();
    });

    it('should not find any if above all except infinity', () => {
        const result = getMinTickIntervalMarker([5, 10, 15, '+Inf'], 20);
        expect(result).toBeUndefined();
    });

    it('should handle a real case', () => {
        const boundaries = [0.001, 0.002, 0.004, 0.006, 0.008, 0.010, 0.015, 0.020, 0.030, 0.050, 0.070, 0.100, 0.150, 0.250, '+Inf'];
        const minTickInterval = 0.050; // 50 ms - svMain
        const result = getMinTickIntervalMarker(boundaries, minTickInterval);
        expect(result).toBe(0.050);
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


suite('getBucketTicketsEstimatedTime', () => {
    const fnc = getBucketTicketsEstimatedTime;
    it('should return an empty array when boundaries array is empty', () => {
        const result = fnc([]);
        expect(result).toEqual([]);
    });

    it('should return an array with one element when boundaries array contains only one number', () => {
        const result = fnc([10]);
        expect(result).toEqual([5]);
    });

    it('should return an array with the median values when boundaries array contains multiple numbers', () => {
        const result = fnc([10, 20, 30]);
        expect(result).toEqual([5, 15, 25]);
    });

    it('should throw an error when boundaries array contains a string that is not "+Inf"', () => {
        expect(() => fnc([10, 'notInf', 30])).toThrowError('Invalid current value: notInf');
    });

    it('should handle "+Inf" in boundaries array', () => {
        const result = fnc([10, '+Inf']);
        expect(result).toEqual([5, 12.5]); // 10 * 1.25
    });

    it('should handle real values in boundaries array', () => {
        const boundaries = [0.001, 0.002, 0.004, 0.006, 0.008, 0.010, 0.015, 0.020, 0.030, 0.050, 0.070, 0.100, 0.150, 0.250, '+Inf'];
        const expected = [0.0005, 0.0015, 0.003, 0.005, 0.007, 0.009, 0.0125, 0.0175, 0.025, 0.04, 0.06, 0.085, 0.125, 0.2, 0.3125];
        const result = fnc(boundaries);
        for (const [i, value] of result.entries()) {
            expect(Math.abs(value - expected[i])).toBeLessThan(Number.EPSILON);
        }
    });
});


suite('getTimeWeightedHistogram', () => {
    const bucketEstimatedAverageTimes = [1, 5, 50];
    //NOTE: the count 9999 does not matter for this test

    it('should return an array of the same length as freqs', () => {
        const perfHist = { count: 9999, freqs: [1, 0, 0] };
        const result = getTimeWeightedHistogram(perfHist, bucketEstimatedAverageTimes);
        expect(result.length).toEqual(perfHist.freqs.length);
    });

    it('should correctly calculate the time-weighted histogram', () => {
        let perfHist = { count: 9999, freqs: [1, 0, 0] };
        let result = getTimeWeightedHistogram(perfHist, bucketEstimatedAverageTimes);
        expect(result).toEqual([1, 0, 0]);

        perfHist = { count: 9999, freqs: [0, 0, 1] };
        result = getTimeWeightedHistogram(perfHist, bucketEstimatedAverageTimes);
        expect(result).toEqual([0, 0, 1]);

        perfHist = { count: 9999, freqs: [0.5, 0, 0.5] };
        result = getTimeWeightedHistogram(perfHist, bucketEstimatedAverageTimes);
        //If the total count was 100, it would be 50x1s + 50x50s = 2550s
        expect(result).toEqual([50 / 2550, 0 / 2550, 2500 / 2550]);

        perfHist = { count: 9999, freqs: [0.8, 0.15, 0.05] };
        result = getTimeWeightedHistogram(perfHist, bucketEstimatedAverageTimes);
        //If the total count was 100, it would be 80x1s + 15x5s + 5x50s = 405s
        const expected = [(80 * 1) / 405, (15 * 5) / 405, (5 * 50) / 405];
        for (const [i, value] of result.entries()) {
            expect(Math.abs(value - expected[i])).toBeLessThan(Number.EPSILON);
        }
    });

    it('should handle freqs with non-number values', () => {
        const perfHist = { count: 9999, freqs: [0.5, 'notANumber', 0.5] };
        const result = getTimeWeightedHistogram(perfHist as any, bucketEstimatedAverageTimes);
        expect(result).toEqual([50 / 2550, 0 / 2550, 2500 / 2550]);
    });
});



suite('splitLogIntoLifespans', () => {
    type PerfProcessorType = (perfLog: SvRtPerfHistType) => number[];
    const minuteMs = 60 * 1000;
    const perfTestResp = Symbol('perfTestResp');
    const perfProcessor: PerfProcessorType = () => perfTestResp as any as number[];
    const perfData = {
        svMain: { count: 1, freqs: [1, 2, 3] },
        svNetwork: { count: 1, freqs: [1, 2, 3] },
        svSync: { count: 1, freqs: [1, 2, 3] },
    }
    const initialEpoch = new Date('2024-01-01').getTime();

    suite('should overall work', () => {
        const perfLog: SvRtLogType = [
            { type: 'svBoot', ts: initialEpoch, duration: 55 },
            { type: 'data', ts: initialEpoch + minuteMs, players: 10, fxsMemory: 100, nodeMemory: 200, perf: perfData },
            { type: 'data', ts: initialEpoch + (minuteMs * 5), players: 20, fxsMemory: 200, nodeMemory: 300, perf: perfData },
            { type: 'svClose', ts: initialEpoch + (minuteMs * 6), reason: 'test' },
        ];

        const result = splitLogIntoLifespans(perfLog, perfProcessor);

        it('should have general structure', () => {
            expect(result.length).toBe(1);
            expect(result[0].bootDuration).toBe(55);
            expect(result[0].log.length).toBe(2);
            expect(result[0].closeReason).toBe('test');
        });
        const firstLifeSpan = result[0];
        const firstSnap = firstLifeSpan.log[0];
        const secondSnap = firstLifeSpan.log[1];
        it('should detect the first snap correctly', () => {
            expect(firstSnap.players).toBe(10);
            expect(firstSnap.fxsMemory).toBe(100);
            expect(firstSnap.nodeMemory).toBe(200);
            expect(firstSnap.weightedPerf).toBe(perfTestResp);
            expect(firstSnap.start).toEqual(new Date(perfLog[0].ts));
            expect(firstSnap.end).toEqual(new Date(perfLog[1].ts));
        });
        it('should detect the second snap correctly', () => {
            expect(secondSnap.players).toBe(20);
            expect(secondSnap.fxsMemory).toBe(200);
            expect(secondSnap.nodeMemory).toBe(300);
            expect(secondSnap.weightedPerf).toBe(perfTestResp);
            expect(secondSnap.start).toEqual(new Date(perfLog[1].ts));
            expect(secondSnap.end).toEqual(new Date(perfLog[2].ts));
        });
    });

    suite('svBoot', () => {
        it('should close pending lifespans', () => {
            const perfLog: SvRtLogType = [
                { type: 'data', ts: initialEpoch, players: 10, fxsMemory: 100, nodeMemory: 200, perf: perfData },
                { type: 'svBoot', ts: initialEpoch + minuteMs, duration: 55 },
                { type: 'data', ts: initialEpoch + (minuteMs * 5), players: 20, fxsMemory: 200, nodeMemory: 300, perf: perfData },
                { type: 'svClose', ts: initialEpoch + (minuteMs * 6), reason: 'test' },
            ];
            const result = splitLogIntoLifespans(perfLog, perfProcessor);
            expect(result.length).toBe(2);
            expect(result[0].bootDuration).toBeUndefined();
            expect(result[0].closeReason).toBeUndefined();
            expect(result[1].bootDuration).toBe(55);
            expect(result[1].closeReason).toBe('test');
        });

        it('should ignore duplicated svBoot', () => {
            const perfLog: SvRtLogType = [
                { type: 'data', ts: initialEpoch, players: 10, fxsMemory: 100, nodeMemory: 200, perf: perfData },
                { type: 'svBoot', ts: initialEpoch, duration: 44 },
                { type: 'svBoot', ts: initialEpoch + minuteMs, duration: 55 },
                { type: 'data', ts: initialEpoch + (minuteMs * 5), players: 20, fxsMemory: 200, nodeMemory: 300, perf: perfData },
                { type: 'svClose', ts: initialEpoch + (minuteMs * 6), reason: 'test' },
            ];
            const result = splitLogIntoLifespans(perfLog, perfProcessor);
            expect(result.length).toBe(2);
            expect(result[0].bootDuration).toBeUndefined();
            expect(result[0].closeReason).toBeUndefined();
            expect(result[1].bootDuration).toBe(55);
            expect(result[1].closeReason).toBe('test');
        });
    });

    suite('svClose', () => {
        it('should ignore svClose without previous data', () => {
            const perfLog: SvRtLogType = [
                { type: 'svClose', ts: initialEpoch, reason: 'test' },
                { type: 'data', ts: initialEpoch + (minuteMs * 6), players: 10, fxsMemory: 100, nodeMemory: 200, perf: perfData },
            ];
            const result = splitLogIntoLifespans(perfLog, perfProcessor);
            expect(result.length).toBe(1);
            expect(result[0].closeReason).toBeUndefined();
            expect(result[0].log.length).toBe(1);
        });

        it('should ignore duplicated svClose', () => {
            const perfLog: SvRtLogType = [
                { type: 'svBoot', ts: initialEpoch, duration: 55 },
                { type: 'data', ts: initialEpoch + minuteMs, players: 10, fxsMemory: 100, nodeMemory: 200, perf: perfData },
                { type: 'svClose', ts: initialEpoch + (minuteMs * 6), reason: 'test' },
                { type: 'svClose', ts: initialEpoch + (minuteMs * 7), reason: 'test' },
            ];
            const result = splitLogIntoLifespans(perfLog, perfProcessor);
            expect(result.length).toBe(1);
            expect(result[0].bootDuration).toBe(55);
            expect(result[0].closeReason).toBe('test');
        });

        it('should close pending lifespans', () => {
            const perfLog: SvRtLogType = [
                { type: 'data', ts: initialEpoch, players: 10, fxsMemory: 100, nodeMemory: 200, perf: perfData },
                { type: 'svClose', ts: initialEpoch + minuteMs, reason: 'test' },
                { type: 'data', ts: initialEpoch + (minuteMs * 6), players: 10, fxsMemory: 100, nodeMemory: 200, perf: perfData },
            ];
            const result = splitLogIntoLifespans(perfLog, perfProcessor);
            expect(result.length).toBe(2);
            expect(result[0].closeReason).toBe('test');
            expect(result[1].log.length).toBe(1);
            expect(result[1].closeReason).toBeUndefined();
        });
    });

    suite('svData', () => {
        it('break lifespan if gap in data above 15 mins', () => {
            const perfLog: SvRtLogType = [
                { type: 'data', ts: initialEpoch, players: 10, fxsMemory: 100, nodeMemory: 200, perf: perfData },
                { type: 'data', ts: initialEpoch + (minuteMs * 16), players: 20, fxsMemory: 200, nodeMemory: 300, perf: perfData },
            ];
            const result = splitLogIntoLifespans(perfLog, perfProcessor);
            expect(result.length).toBe(2);
            expect(result[0].log.length).toBe(1);
            expect(result[1].log.length).toBe(1);
        });

        it('should default start to be 1 min old if svBoot is above 15 mins old', () => {
            const perfLog: SvRtLogType = [
                { type: 'svBoot', ts: initialEpoch - (minuteMs * 16), duration: 55 },
                { type: 'data', ts: initialEpoch, players: 10, fxsMemory: 100, nodeMemory: 200, perf: perfData },
            ];
            const result = splitLogIntoLifespans(perfLog, perfProcessor);
            expect(result.length).toBe(1);
            expect(result[0].log.length).toBe(1);
            expect(result[0].log[0].start).toEqual(new Date(initialEpoch - minuteMs));
        });

        it('should default for the start of data to be 1 min ago', () => {
            const perfLog: SvRtLogType = [
                { type: 'data', ts: initialEpoch, players: 10, fxsMemory: 100, nodeMemory: 200, perf: perfData },
            ];
            const result = splitLogIntoLifespans(perfLog, perfProcessor);
            expect(result[0].log[0].start).toEqual(new Date(initialEpoch - minuteMs));
        });

        it('should default data start time to svBoot if less than 15 mins old', () => {
            const perfLog: SvRtLogType = [
                { type: 'svBoot', ts: initialEpoch, duration: 55 },
                { type: 'data', ts: initialEpoch + (minuteMs * 5), players: 10, fxsMemory: 100, nodeMemory: 200, perf: perfData },
            ];
            const result = splitLogIntoLifespans(perfLog, perfProcessor);
            expect(result[0].log[0].start).toEqual(new Date(initialEpoch));
        });
    });
});
