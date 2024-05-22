import { PERF_DATA_BUCKET_COUNT, isValidPerfThreadName, type PerfDataBucketBoundariesType, type PerfDataThreadNamesType } from "./perfSchemas";


//Consts
const REGEX_BUCKET_BOUNDARIE = /le="(\d+(\.\d+)?|\+Inf)"/;
const REGEX_PERF_LINE = /tickTime_(count|sum|bucket)\{name="(svSync|svNetwork|svMain)"(,le="(\d+(\.\d+)?|\+Inf)")?\}\s(\S+)/;

//Types
type ParsedRawPerfType = {
    bucketBoundaries: PerfDataBucketBoundariesType,
    metrics: Record<PerfDataThreadNamesType, {
        count: number,
        sum: number,
        buckets: number[]
    }>
};


/**
 * Returns if the given thread name is a valid PerfDataThreadNamesType
 */
export const arePerfBucketBoundariesValid = (boundaries: (number | string)[]): boundaries is PerfDataBucketBoundariesType => {
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
 * Parses the output of FXServer /perf/ in the proteus format
 */
export const parsePerf = (rawData: string): ParsedRawPerfType => {
    if (typeof rawData !== 'string') throw new Error('string expected');
    const lines = rawData.trim().split('\n');
    const metrics: ParsedRawPerfType['metrics'] = {
        svSync: {
            count: 0,
            sum: 0,
            buckets: [],
        },
        svNetwork: {
            count: 0,
            sum: 0,
            buckets: [],
        },
        svMain: {
            count: 0,
            sum: 0,
            buckets: [],
        },
    };

    //Extract bucket boundaries
    const bucketBoundaries = lines
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
        }) as PerfDataBucketBoundariesType; //it's alright, will check later
    if (!arePerfBucketBoundariesValid(bucketBoundaries)) {
        throw new Error('invalid bucket boundaries');
    }

    //Parse lines
    for (const line of lines) {
        const parsed = line.match(REGEX_PERF_LINE);
        if (parsed === null) continue;
        const regType = parsed[1];
        const thread = parsed[2];
        const bucket = parsed[4];
        const value = parsed[6];
        if (!isValidPerfThreadName(thread)) continue;

        if (regType == 'count') {
            const count = parseInt(value);
            if (!isNaN(count)) metrics[thread].count = count;
        } else if (regType == 'sum') {
            const sum = parseFloat(value);
            if (!isNaN(sum)) metrics[thread].sum = sum;
        } else if (regType == 'bucket') {
            //Check if the bucket is correct
            const currBucketIndex = metrics[thread].buckets.length;
            const lastBucketIndex = PERF_DATA_BUCKET_COUNT - 1;
            if (currBucketIndex === lastBucketIndex) {
                if (bucket !== '+Inf') {
                    throw new Error(`unexpected last bucket to be +Inf and got ${bucket}`);
                }
            } else if (parseFloat(bucket) !== bucketBoundaries[currBucketIndex]) {
                throw new Error(`unexpected bucket ${bucket} at position ${currBucketIndex}`);
            }
            //Add the bucket
            metrics[thread].buckets.push(parseInt(value));
        }
    }

    //Check perf validity
    const invalid = Object.values(metrics).filter((thread) => {
        return (
            !Number.isInteger(thread.count)
            || thread.count === 0
            || !Number.isFinite(thread.sum)
            || thread.sum === 0
            || thread.buckets.length !== PERF_DATA_BUCKET_COUNT
        );
    });
    if (invalid.length) {
        throw new Error(`${invalid.length} invalid threads in /perf/`);
    }

    return { bucketBoundaries, metrics };
};
