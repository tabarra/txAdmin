import { ValuesType } from 'utility-types';
import * as z from 'zod';


/**
 * Consts
 */
export const PERF_DATA_BUCKET_COUNT = 15;
export const PERF_DATA_THREAD_NAMES = ['svNetwork', 'svSync', 'svMain'] as const;
export type PerfDataThreadNamesType = ValuesType<typeof PERF_DATA_THREAD_NAMES>;


/**
 * Returns if the given thread name is a valid PerfDataThreadNamesType
 */
export const isValidPerfThreadName = (threadName: string): threadName is PerfDataThreadNamesType => {
    return PERF_DATA_THREAD_NAMES.includes(threadName as PerfDataThreadNamesType);
}


/**
 * Schemas
 */
export const PerfDataBucketBoundariesSchema = z.array(z.union([
    z.number().nonnegative(),
    z.literal('+Inf'),
]));


//Last snapshot stuff - only the necessary data to calculate the histogram
export const PerfDataRawThreadDataSchema = z.object({
    sum: z.number().positive(), //FIXME: required???
    count: z.number().int().positive(), //FIXME: required???
    buckets: z.array(z.number().int().nonnegative()).length(PERF_DATA_BUCKET_COUNT),
});

export const PerfDataRawThreadsSchema = z.object({
    svSync: PerfDataRawThreadDataSchema,
    svNetwork: PerfDataRawThreadDataSchema,
    svMain: PerfDataRawThreadDataSchema,
})

export const PerfDataPreviousSchema = z.object({
    ts: z.number().int().positive(), //FIXME: required???
    mainTickCounter: z.number().int().positive(),
    perf: PerfDataRawThreadsSchema,
});


//Snapshot stuff - only the necessary data for the chart
export const PerfDataBucketFreqsSchema = z.array(z.number().nonnegative());

export const PerfDataSnapshotSchema = z.object({
    ts: z.number().int().positive(),
    skipped: z.boolean(),
    players: z.number().int().positive(),
    // fxsMemoryUsedMb: z.number().nonnegative(),
    // nodeHeapTotalMb: z.number().nonnegative(),
    perf: z.object({
        svSync: PerfDataBucketFreqsSchema,
        svNetwork: PerfDataBucketFreqsSchema,
        svMain: PerfDataBucketFreqsSchema,
    }),
});


//File schema
export const PerfDataFileSchema = z.object({
    version: z.literal(1),
    bucketBoundaries: PerfDataBucketBoundariesSchema,
    previous: PerfDataPreviousSchema,
    log: z.array(PerfDataSnapshotSchema),
});


//Exporting types
export type PerfDataRawThreadDataType = z.infer<typeof PerfDataRawThreadDataSchema>;
export type PerfDataRawThreadsType = z.infer<typeof PerfDataRawThreadsSchema>;
export type PerfDataPreviousType = z.infer<typeof PerfDataPreviousSchema>;
export type PerfDataBucketFreqsType = z.infer<typeof PerfDataBucketFreqsSchema>;
export type PerfDataSnapshotType = z.infer<typeof PerfDataSnapshotSchema>;
export type PerfDataBucketBoundariesType = z.infer<typeof PerfDataBucketBoundariesSchema>;
export type PerfDataFileType = z.infer<typeof PerfDataFileSchema>;
