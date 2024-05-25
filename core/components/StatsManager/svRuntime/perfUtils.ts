import { cloneDeep } from 'lodash-es';
import type { SSPerfCountsType, SSPerfHistType } from "./perfSchemas";
import got from '@core/extras/got.js';
import { parseRawPerf } from './perfParser';
import { getProcessesData } from '@core/webroutes/diagnostics/diagnosticsFuncs';
import { PERF_DATA_BUCKET_COUNT, PerfDataThreadNamesType } from './config';


//Consts
const perfDataRawThreadsTemplate: SSPerfCountsType = {
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
export const diffPerfs = (newPerf: SSPerfCountsType, oldPerf?: SSPerfCountsType) => {
    const basePerf = oldPerf ?? cloneDeep(perfDataRawThreadsTemplate);
    return {
        svSync: {
            count: newPerf.svSync.count - basePerf.svSync.count,
            // sum: newPerf.svSync.sum - basePerf.svSync.sum,
            buckets: newPerf.svSync.buckets.map((bucket, i) => bucket - basePerf.svSync.buckets[i]),
        },
        svNetwork: {
            count: newPerf.svNetwork.count - basePerf.svNetwork.count,
            // sum: newPerf.svNetwork.sum - basePerf.svNetwork.sum,
            buckets: newPerf.svNetwork.buckets.map((bucket, i) => bucket - basePerf.svNetwork.buckets[i]),
        },
        svMain: {
            count: newPerf.svMain.count - basePerf.svMain.count,
            // sum: newPerf.svMain.sum - basePerf.svMain.sum,
            buckets: newPerf.svMain.buckets.map((bucket, i) => bucket - basePerf.svMain.buckets[i]),
        },
    };
};


/**
 * Transforms raw perf data into a frequency distribution (histogram)
 * ForEach thread, individualize tick counts (instead of CumSum) and calculates frequency
 */
export const perfCountsToHist = (threads: SSPerfCountsType) => {
    const currPerfFreqs: SSPerfHistType = {
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


/**
 * Requests /perf/, parses it and returns the raw perf data
 */
export const fetchRawPerfData = async (fxServerHost: string) => {
    const currPerfRaw = await got(`http://${fxServerHost}/perf/`).text();
    return parseRawPerf(currPerfRaw);
}


/**
 * Get the fxserver memory usage
 */
export const fetchFxsMemory = async () => {
    const allProcsData = await getProcessesData();
    if (!allProcsData) return;

    const fxProcData = allProcsData.find((proc) => proc.name === 'FXServer');
    if (!fxProcData) return;

    return parseFloat((fxProcData.memory).toFixed(2));
}
