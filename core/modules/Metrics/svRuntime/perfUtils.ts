import pidusage from 'pidusage';
import { cloneDeep } from 'lodash-es';
import type { SvRtPerfCountsType } from "./perfSchemas";
import got from '@lib/got';
import { parseRawPerf } from './perfParser';
import { PERF_DATA_BUCKET_COUNT } from './config';
import { txEnv } from '@core/globalData';


//Consts
const perfDataRawThreadsTemplate: SvRtPerfCountsType = {
    svSync: {
        count: 0,
        sum: 0,
        buckets: Array(PERF_DATA_BUCKET_COUNT).fill(0),
    },
    svNetwork: {
        count: 0,
        sum: 0,
        buckets: Array(PERF_DATA_BUCKET_COUNT).fill(0),
    },
    svMain: {
        count: 0,
        sum: 0,
        buckets: Array(PERF_DATA_BUCKET_COUNT).fill(0),
    }
};


/**
 * Compares a perf snapshot with the one that came before
 * NOTE: I could just clone the old perf data, but this way I guarantee the shape of the data
 */
export const diffPerfs = (newPerf: SvRtPerfCountsType, oldPerf?: SvRtPerfCountsType) => {
    const basePerf = oldPerf ?? cloneDeep(perfDataRawThreadsTemplate);
    return {
        svSync: {
            count: newPerf.svSync.count - basePerf.svSync.count,
            sum: newPerf.svSync.sum - basePerf.svSync.sum,
            buckets: newPerf.svSync.buckets.map((bucket, i) => bucket - basePerf.svSync.buckets[i]),
        },
        svNetwork: {
            count: newPerf.svNetwork.count - basePerf.svNetwork.count,
            sum: newPerf.svNetwork.sum - basePerf.svNetwork.sum,
            buckets: newPerf.svNetwork.buckets.map((bucket, i) => bucket - basePerf.svNetwork.buckets[i]),
        },
        svMain: {
            count: newPerf.svMain.count - basePerf.svMain.count,
            sum: newPerf.svMain.sum - basePerf.svMain.sum,
            buckets: newPerf.svMain.buckets.map((bucket, i) => bucket - basePerf.svMain.buckets[i]),
        },
    };
};


/**
 * Checks if any perf count/sum from any thread reset (if old > new)
 */
export const didPerfReset = (newPerf: SvRtPerfCountsType, oldPerf: SvRtPerfCountsType) => {
    return (
        (oldPerf.svSync.count > newPerf.svSync.count) ||
        (oldPerf.svSync.sum > newPerf.svSync.sum) ||
        (oldPerf.svNetwork.count > newPerf.svNetwork.count) ||
        (oldPerf.svNetwork.sum > newPerf.svNetwork.sum) ||
        (oldPerf.svMain.count > newPerf.svMain.count) ||
        (oldPerf.svMain.sum > newPerf.svMain.sum)
    );
}


/**
 * Transforms raw perf data into a frequency distribution (histogram)
 * ForEach thread, individualize tick counts (instead of CumSum) and calculates frequency
 */
// export const perfCountsToHist = (threads: SvRtPerfCountsType) => {
//     const currPerfFreqs: SvRtPerfHistType = {
//         svSync: {
//             count: threads.svSync.count,
//             freqs: [],
//         },
//         svNetwork: {
//             count: threads.svNetwork.count,
//             freqs: [],
//         },
//         svMain: {
//             count: threads.svMain.count,
//             freqs: [],
//         },
//     };
//     for (const [tName, tData] of Object.entries(threads)) {
//         currPerfFreqs[tName as SvRtPerfThreadNamesType].freqs = tData.buckets.map((bucketValue, bucketIndex) => {
//             const prevBucketValue = (bucketIndex) ? tData.buckets[bucketIndex - 1] : 0;
//             return (bucketValue - prevBucketValue) / tData.count;
//         });
//     }
//     return currPerfFreqs;
// }


/**
 * Requests /perf/, parses it and returns the raw perf data
 */
export const fetchRawPerfData = async (netEndpoint: string) => {
    const currPerfRaw = await got(`http://${netEndpoint}/perf/`).text();
    return parseRawPerf(currPerfRaw);
}


/**
 * Get the fxserver memory usage
 * FIXME: migrate to use gwmi on windows by default
 */
export const fetchFxsMemory = async (fxsPid?: number) => {
    if (!fxsPid) return;
    try {
        const pidUsage = await pidusage(fxsPid);
        const memoryMb = pidUsage.memory / 1024 / 1024;
        return parseFloat((memoryMb).toFixed(2));
    } catch (error) {
        if ((error as any).code = 'ENOENT') {
            console.error('Failed to get processes tree usage data.');
            if (!txCore.fxRunner.child?.isAlive) {
                console.error('The server process is not running.');
            } if (txEnv.isWindows) {
                console.error('This is probably because the `wmic` command is not available in your system.');
                console.error('If you are on Windows 11 or Windows Server 2025, you can enable it in the "Windows Features" settings.');
            } else {
                console.error('This is probably because the `ps` command is not available in your system.');
                console.error('This command is part of the `procps` package in most Linux distributions.');
            }
            return;
        } else {
            throw error;
        }
    }
}
