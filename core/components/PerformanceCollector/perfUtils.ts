import { cloneDeep } from 'lodash-es';
import { PERF_DATA_BUCKET_COUNT } from "./perfSchemas";
import type {SSRawPerfType, SSLogDataPerfType, PerfDataThreadNamesType} from "./perfSchemas";


//Consts
const perfDataRawThreadsTemplate: SSRawPerfType = {
    svSync: {
        count: 0,
        // sum: 0,
        buckets: Array(PERF_DATA_BUCKET_COUNT).fill(0),
    },
    svNetwork: {
        count: 0,
        // sum: 0,
        buckets: Array(PERF_DATA_BUCKET_COUNT).fill(0),
    },
    svMain: {
        count: 0,
        // sum: 0,
        buckets: Array(PERF_DATA_BUCKET_COUNT).fill(0),
    }
};


/**
 * Compares a perf snapshot with the one that came before
 */
export const diffPerfs = (newPerf: SSRawPerfType, oldPerf?: SSRawPerfType) => {
    if (!oldPerf) {
        oldPerf = cloneDeep(perfDataRawThreadsTemplate);
    }
    return {
        svSync: {
            count: newPerf.svSync.count - oldPerf.svSync.count,
            // sum: newPerf.svSync.sum - oldPerf.svSync.sum,
            buckets: newPerf.svSync.buckets.map((bucket, i) => bucket - oldPerf.svSync.buckets[i]),
        },
        svNetwork: {
            count: newPerf.svNetwork.count - oldPerf.svNetwork.count,
            // sum: newPerf.svNetwork.sum - oldPerf.svNetwork.sum,
            buckets: newPerf.svNetwork.buckets.map((bucket, i) => bucket - oldPerf.svNetwork.buckets[i]),
        },
        svMain: {
            count: newPerf.svMain.count - oldPerf.svMain.count,
            // sum: newPerf.svMain.sum - oldPerf.svMain.sum,
            buckets: newPerf.svMain.buckets.map((bucket, i) => bucket - oldPerf.svMain.buckets[i]),
        },
    };
};


/**
 * Transforms raw perf data into a frequency distribution (histogram)
 * ForEach thread, individualize tick counts (instead of CumSum) and calculates frequency
 */
export const rawPerfToFreqs = (threads: SSRawPerfType) => {
    const currPerfFreqs: SSLogDataPerfType = {
        svSync: {
            count: threads.svSync.count,
            freqs: [],
        },
        svNetwork: {
            count: threads.svNetwork.count,
            freqs: [],
        },
        svMain: {
            count: threads.svMain.count,
            freqs: [],
        },
    };
    for (const [tName, tData] of Object.entries(threads)) {
        currPerfFreqs[tName as PerfDataThreadNamesType].freqs = tData.buckets.map((bucketValue, bucketIndex) => {
            const prevBucketValue = (bucketIndex) ? tData.buckets[bucketIndex - 1] : 0;
            return (bucketValue - prevBucketValue) / tData.count;
        });
    }

    return currPerfFreqs;
}
