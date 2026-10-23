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
tickTime_bucket{name="svNetwork",le="0.001"} 1840798
tickTime_bucket{name="svNetwork",le="0.002"} 1840804
tickTime_bucket{name="svNetwork",le="0.004"} 1840805
tickTime_bucket{name="svNetwork",le="0.006"} 1840805
tickTime_bucket{name="svNetwork",le="0.008"} 1840805
tickTime_bucket{name="svNetwork",le="0.01"} 1840805
tickTime_bucket{name="svNetwork",le="0.015"} 1840805
tickTime_bucket{name="svNetwork",le="0.02"} 1840805
tickTime_bucket{name="svNetwork",le="0.03"} 1840805
tickTime_bucket{name="svNetwork",le="0.05"} 1840805
tickTime_bucket{name="svNetwork",le="0.07"} 1840805
tickTime_bucket{name="svNetwork",le="0.1"} 1840805
tickTime_bucket{name="svNetwork",le="0.15"} 1840805
tickTime_bucket{name="svNetwork",le="0.25"} 1840805
tickTime_bucket{name="svNetwork",le="+Inf"} 1840805
tickTime_count{name="svSync"} 2268704
tickTime_sum{name="svSync"} 1091.617999988212
tickTime_bucket{name="svSync",le="0.001"} 2267516
tickTime_bucket{name="svSync",le="0.002"} 2268532
tickTime_bucket{name="svSync",le="0.004"} 2268664
tickTime_bucket{name="svSync",le="0.006"} 2268685
tickTime_bucket{name="svSync",le="0.008"} 2268686
tickTime_bucket{name="svSync",le="0.01"} 2268688
tickTime_bucket{name="svSync",le="0.015"} 2268703
tickTime_bucket{name="svSync",le="0.02"} 2268704
tickTime_bucket{name="svSync",le="0.03"} 2268704
tickTime_bucket{name="svSync",le="0.05"} 2268704
tickTime_bucket{name="svSync",le="0.07"} 2268704
tickTime_bucket{name="svSync",le="0.1"} 2268704
tickTime_bucket{name="svSync",le="0.15"} 2268704
tickTime_bucket{name="svSync",le="0.25"} 2268704
tickTime_bucket{name="svSync",le="+Inf"} 2268704
tickTime_count{name="svMain"} 355594
tickTime_sum{name="svMain"} 1330.458999996208
tickTime_bucket{name="svMain",le="0.001"} 299261
tickTime_bucket{name="svMain",le="0.002"} 327819
tickTime_bucket{name="svMain",le="0.004"} 352052
tickTime_bucket{name="svMain",le="0.006"} 354360
tickTime_bucket{name="svMain",le="0.008"} 354808
tickTime_bucket{name="svMain",le="0.01"} 355262
tickTime_bucket{name="svMain",le="0.015"} 355577
tickTime_bucket{name="svMain",le="0.02"} 355591
tickTime_bucket{name="svMain",le="0.03"} 355591
tickTime_bucket{name="svMain",le="0.05"} 355592
tickTime_bucket{name="svMain",le="0.07"} 355593
tickTime_bucket{name="svMain",le="0.1"} 355593
tickTime_bucket{name="svMain",le="0.15"} 355593
tickTime_bucket{name="svMain",le="0.25"} 355593
tickTime_bucket{name="svMain",le="+Inf"} 355594`;

suite('parseRawPerf', () => {
    it('should parse the perf data correctly', () => {
        const result = parseRawPerf(perfValidExample);
        expect(result.perfBoundaries).toEqual([0.001, 0.002, 0.004, 0.006, 0.008, 0.01, 0.015, 0.02, 0.03, 0.05, 0.07, 0.1, 0.15, 0.25, '+Inf']);
        expect(result.perfMetrics.svNetwork.count).toBe(1840805);
        expect(result.perfMetrics.svSync.count).toBe(2268704);
        expect(result.perfMetrics.svMain.count).toBe(355594);
        expect(result.perfMetrics.svSync.sum).toBe(1091.617999988212);
        expect(result.perfMetrics.svMain.buckets).toEqual([299261, 28558, 24233, 2308, 448, 454, 315, 14, 0, 1, 1, 0, 0, 0, 1]);
    });

    it('should select the GameServer instance when a thread has multiple instances', () => {
        const gameServerPerf = perfValidExample.replaceAll(
            '{name="svNetwork"',
            '{instance="GameServer",name="svNetwork"',
        );
        const voiceServerPerf = perfValidExample
            .split('\n')
            .filter((line) => line.includes('{name="svNetwork"'))
            .map((line) => line
                .replace('{name="svNetwork"', '{instance="VoiceServer",name="svNetwork"')
                .replace(/\s\S+$/, ' 42'))
            .join('\n');

        const result = parseRawPerf(`${voiceServerPerf}\n${gameServerPerf}`);
        expect(result.perfMetrics.svNetwork.count).toBe(1840805);
        expect(result.perfMetrics.svNetwork.sum).toBe(76.39499999999963);
    });

    it('should accept zero-valued metrics while the server is starting', () => {
        const perfWithZeroNetworkMetrics = perfValidExample
            .split('\n')
            .map((line) => line.includes('{name="svNetwork"')
                ? line.replace(/\s\S+$/, ' 0')
                : line)
            .join('\n');

        const result = parseRawPerf(perfWithZeroNetworkMetrics);
        expect(result.perfMetrics.svNetwork.count).toBe(0);
        expect(result.perfMetrics.svNetwork.sum).toBe(0);
        expect(result.perfMetrics.svNetwork.buckets).toEqual(Array(15).fill(0));
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

        let targetLine = 'tickTime_bucket{name="svMain",le="0.25"} 355593';
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
