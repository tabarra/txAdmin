import { test, expect, it, suite } from 'vitest';
import { arePerfBoundariesValid, parseRawPerf, revertCumulativeBuckets } from './perfParser';


test('arePerfBoundariesValid', () => {
    const fnc = arePerfBoundariesValid;
    expect(fnc([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, '+Inf'])).toBe(true);
    expect(fnc([])).toBe(false); //length
    expect(fnc([1, 2, 3])).toBe(false); //length
    expect(fnc([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])).toBe(false); //last item
    expect(fnc([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'xx', 12, 13, 14, '+Inf'])).toBe(false); //always number, except last
    expect(fnc([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 11, 12, 13, 14, '+Inf'])).toBe(false); //always increasing
    expect(fnc([0.1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 11, 12, 999, 14, '+Inf'])).toBe(false); //always increasing
});


const perfValidExample = `# HELP tickTime Time spent on server ticks
# TYPE tickTime histogram
tickTime_count{name="svNetwork"} 1840805
tickTime_sum{name="svNetwork"} 76.39499999999963
tickTime_bucket{name="svNetwork",le="0.005"} 1840798
tickTime_bucket{name="svNetwork",le="0.01"} 1840804
tickTime_bucket{name="svNetwork",le="0.025"} 1840805
tickTime_bucket{name="svNetwork",le="0.05"} 1840805
tickTime_bucket{name="svNetwork",le="0.075"} 1840805
tickTime_bucket{name="svNetwork",le="0.1"} 1840805
tickTime_bucket{name="svNetwork",le="0.25"} 1840805
tickTime_bucket{name="svNetwork",le="0.5"} 1840805
tickTime_bucket{name="svNetwork",le="0.75"} 1840805
tickTime_bucket{name="svNetwork",le="1"} 1840805
tickTime_bucket{name="svNetwork",le="2.5"} 1840805
tickTime_bucket{name="svNetwork",le="5"} 1840805
tickTime_bucket{name="svNetwork",le="7.5"} 1840805
tickTime_bucket{name="svNetwork",le="10"} 1840805
tickTime_bucket{name="svNetwork",le="+Inf"} 1840805
tickTime_count{name="svSync"} 2268704
tickTime_sum{name="svSync"} 1091.617999988212
tickTime_bucket{name="svSync",le="0.005"} 2267516
tickTime_bucket{name="svSync",le="0.01"} 2268532
tickTime_bucket{name="svSync",le="0.025"} 2268664
tickTime_bucket{name="svSync",le="0.05"} 2268685
tickTime_bucket{name="svSync",le="0.075"} 2268686
tickTime_bucket{name="svSync",le="0.1"} 2268688
tickTime_bucket{name="svSync",le="0.25"} 2268703
tickTime_bucket{name="svSync",le="0.5"} 2268704
tickTime_bucket{name="svSync",le="0.75"} 2268704
tickTime_bucket{name="svSync",le="1"} 2268704
tickTime_bucket{name="svSync",le="2.5"} 2268704
tickTime_bucket{name="svSync",le="5"} 2268704
tickTime_bucket{name="svSync",le="7.5"} 2268704
tickTime_bucket{name="svSync",le="10"} 2268704
tickTime_bucket{name="svSync",le="+Inf"} 2268704
tickTime_count{name="svMain"} 355594
tickTime_sum{name="svMain"} 1330.458999996208
tickTime_bucket{name="svMain",le="0.005"} 299261
tickTime_bucket{name="svMain",le="0.01"} 327819
tickTime_bucket{name="svMain",le="0.025"} 352052
tickTime_bucket{name="svMain",le="0.05"} 354360
tickTime_bucket{name="svMain",le="0.075"} 354808
tickTime_bucket{name="svMain",le="0.1"} 355262
tickTime_bucket{name="svMain",le="0.25"} 355577
tickTime_bucket{name="svMain",le="0.5"} 355591
tickTime_bucket{name="svMain",le="0.75"} 355591
tickTime_bucket{name="svMain",le="1"} 355592
tickTime_bucket{name="svMain",le="2.5"} 355593
tickTime_bucket{name="svMain",le="5"} 355593
tickTime_bucket{name="svMain",le="7.5"} 355593
tickTime_bucket{name="svMain",le="10"} 355593
tickTime_bucket{name="svMain",le="+Inf"} 355594`;

suite('parseRawPerf', () => {
    it('should parse the perf data correctly', () => {
        const result = parseRawPerf(perfValidExample);
        expect(result.perfBoundaries).toEqual([0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5, 10, '+Inf']);
        expect(result.perfMetrics.svNetwork.count).toBe(1840805);
        expect(result.perfMetrics.svSync.count).toBe(2268704);
        expect(result.perfMetrics.svMain.count).toBe(355594);
        expect(result.perfMetrics.svSync.sum).toBe(1091.617999988212);
        expect(result.perfMetrics.svMain.buckets).toEqual([299261, 28558, 24233, 2308, 448, 454, 315, 14, 0, 1, 1, 0, 0, 0, 1]);
    });

    it('should detect bad perf output', () => {
        expect(() => parseRawPerf(null as any)).toThrow('string expected');
        expect(() => parseRawPerf('bad data')).toThrow('missing tickTime_');
    });

    it('should detect server still booting', () => {
        const perfNoMain = perfValidExample.replaceAll('svMain', 'idk');
        expect(() => parseRawPerf(perfNoMain)).toThrow('missing threads');
    });

    it('should handle bad data', () => {
        expect(() => parseRawPerf(123 as any)).toThrow('string expected');

        let targetLine = 'tickTime_bucket{name="svMain",le="10"} 355593';
        let perfModifiedExample = perfValidExample.replace(targetLine, '');
        expect(() => parseRawPerf(perfModifiedExample)).toThrow('invalid bucket boundaries');

        targetLine = 'tickTime_bucket{name="svNetwork",le="+Inf"} 1840805';
        perfModifiedExample = perfValidExample.replace(targetLine, '');
        expect(() => parseRawPerf(perfModifiedExample)).toThrow('invalid threads');

        targetLine = 'tickTime_count{name="svNetwork"} 1840805';
        perfModifiedExample = perfValidExample.replace(targetLine, 'tickTime_count{name="svNetwork"} ????');
        expect(() => parseRawPerf(perfModifiedExample)).toThrow('invalid threads');
    });
});


suite('revertCumulativeBuckets', () => {
    it('should convert the simplest case', () => {
        const result = revertCumulativeBuckets([10, 20, 30]);
        expect(result).toEqual([10, 10, 10]);
    });

    it('should convert a real case correctly', () => {
        const result = revertCumulativeBuckets([299261, 327819, 352052, 354360, 354808, 355262, 355577, 355591, 355591, 355592, 355593, 355593, 355593, 355593, 355594]);
        expect(result).toEqual([299261, 28558, 24233, 2308, 448, 454, 315, 14, 0, 1, 1, 0, 0, 0, 1]);

    });

    it('should return same length', () => {
        expect(revertCumulativeBuckets([]).length).toBe(0);
        expect(revertCumulativeBuckets([1, 2, 3, 4, 5]).length).toBe(5);
        expect(revertCumulativeBuckets(Array(9999).fill(0)).length).toBe(9999);
    });
});
