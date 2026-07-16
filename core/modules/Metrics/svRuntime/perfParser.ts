import { PERF_DATA_BUCKET_COUNT } from "./config";
import { isValidPerfThreadName, type SvRtPerfBoundariesType, type SvRtPerfCountsType } from "./perfSchemas";


//Consts
const REGEX_BUCKET_BOUNDARIE = /le="(\d+(\.\d+)?|\+Inf)"/;
const REGEX_PERF_LINE = /tickTime_(count|sum|bucket)\{(?:instance="([^"]+)",)?name="(svSync|svNetwork|svMain)"(?:,le="(\d+(?:\.\d+)?|\+Inf)")?\}\s(\S+)/;


/**
 * Returns if the given thread name is a valid SvRtPerfThreadNamesType
 */
export const arePerfBoundariesValid = (boundaries: (number | string)[]): boundaries is SvRtPerfBoundariesType => {
    // Check if the length is correct
    if (boundaries.length !== PERF_DATA_BUCKET_COUNT) {
        return false;
    }

    // Check if the last item is +Inf
    if (boundaries[boundaries.length - 1] !== '+Inf') {
        return false;
    }

    //Check any value is non-numeric except the last one
    if (boundaries.slice(0, -1).some((val) => typeof val === 'string')) {
        return false;
    }

    // Check if the values only increase
    for (let i = 1; i < boundaries.length - 1; i++) {
        if (boundaries[i] <= boundaries[i - 1]) {
            return false;
        }
    }

    return true;
}


/**
 * Returns a buckets array with individual counts instead of cumulative counts
 */
export const revertCumulativeBuckets = (cumulativeCounts: number[]): number[] => {
    const individualCounts = [];
    for (let i = 0; i < cumulativeCounts.length; i++) {
        const currCount = cumulativeCounts[i];
        if (typeof currCount !== 'number') throw new Error('number expected');
        if (!Number.isInteger(currCount)) throw new Error('integer expected');
        if (!Number.isFinite(currCount)) throw new Error('finite number expected');
        if (i === 0) {
            individualCounts.push(currCount);
        } else {
            const lastCount = cumulativeCounts[i - 1] as number;
            if (lastCount > currCount) throw new Error('retrograde cumulative count');
            individualCounts.push(currCount - lastCount);
        }
    }
    return individualCounts;
};


/**
 * Parses the output of FXServer /perf/ in the proteus format
 */
export const parseRawPerf = (rawData: string) => {
    if (typeof rawData !== 'string') throw new Error('string expected');
    const lines = rawData.trim().split('\n');
    const perfMetrics: SvRtPerfCountsType = {
        svSync: {
            count: Number.NaN,
            sum: Number.NaN,
            buckets: [],
        },
        svNetwork: {
            count: Number.NaN,
            sum: Number.NaN,
            buckets: [],
        },
        svMain: {
            count: Number.NaN,
            sum: Number.NaN,
            buckets: [],
        },
    };

    //Checking basic integrity
    if(!rawData.includes('tickTime_')){
        throw new Error('missing tickTime_ in /perf/');
    }
    if (!rawData.includes('svMain') || !rawData.includes('svNetwork') || !rawData.includes('svSync')) {
        throw new Error('missing threads in /perf/');
    }

    //Extract bucket boundaries
    const perfBoundaries = lines
        .filter((line) => line.startsWith('tickTime_bucket{name="svMain"'))
        .map((line) => {
            const parsed = line.match(REGEX_BUCKET_BOUNDARIE);
            if (parsed === null) {
                return undefined;
            } else if (parsed[1] === '+Inf') {
                return '+Inf';
            } else {
                return parseFloat(parsed[1]);
            };
        })
        .filter((val): val is number | '+Inf' => {
            return val !== undefined && (val === '+Inf' || isFinite(val))
        }) as SvRtPerfBoundariesType; //it's alright, will check later
    if (!arePerfBoundariesValid(perfBoundaries)) {
        throw new Error('invalid bucket boundaries');
    }

    //Parse lines
    for (const line of lines) {
        const parsed = line.match(REGEX_PERF_LINE);
        if (parsed === null) continue;
        const regType = parsed[1];
        const instance = parsed[2];
        const thread = parsed[3];
        const bucket = parsed[4];
        const value = parsed[5];
        if (!isValidPerfThreadName(thread)) continue;
        // Gen9 can expose the same thread metric for multiple server instances.
        if (instance !== undefined && instance !== 'GameServer') continue;

        if (regType == 'count') {
            const count = parseInt(value);
            if (!isNaN(count)) perfMetrics[thread].count = count;
        } else if (regType == 'sum') {
            const sum = parseFloat(value);
            if (!isNaN(sum)) perfMetrics[thread].sum = sum;
        } else if (regType == 'bucket') {
            //Check if the bucket is correct
            const currBucketIndex = perfMetrics[thread].buckets.length;
            const lastBucketIndex = PERF_DATA_BUCKET_COUNT - 1;
            if (currBucketIndex === lastBucketIndex) {
                if (bucket !== '+Inf') {
                    throw new Error(`unexpected last bucket to be +Inf and got ${bucket}`);
                }
            } else if (parseFloat(bucket) !== perfBoundaries[currBucketIndex]) {
                throw new Error(`unexpected bucket ${bucket} at position ${currBucketIndex}`);
            }
            //Add the bucket
            perfMetrics[thread].buckets.push(parseInt(value));
        }
    }

    //Check perf validity
    const invalid = Object.values(perfMetrics).filter((thread) => {
        return (
            !Number.isInteger(thread.count)
            || !Number.isFinite(thread.sum)
            || thread.buckets.length !== PERF_DATA_BUCKET_COUNT
        );
    });
    if (invalid.length) {
        throw new Error(`${invalid.length} invalid threads in /perf/`);
    }

    //Reverse the cumulative buckets
    perfMetrics.svSync.buckets = revertCumulativeBuckets(perfMetrics.svSync.buckets);
    perfMetrics.svNetwork.buckets = revertCumulativeBuckets(perfMetrics.svNetwork.buckets);
    perfMetrics.svMain.buckets = revertCumulativeBuckets(perfMetrics.svMain.buckets);

    return { perfBoundaries, perfMetrics };
};
