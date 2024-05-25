import * as z from 'zod';
import { PERF_DATA_BUCKET_COUNT, PERF_DATA_THREAD_NAMES, PerfDataThreadNamesType } from './config';
import { ValuesType } from 'utility-types';


/**
 * Type guards
 */
export const isValidPerfThreadName = (threadName: string): threadName is PerfDataThreadNamesType => {
    return PERF_DATA_THREAD_NAMES.includes(threadName as PerfDataThreadNamesType);
}
export const isSSLogDataType = (log: ValuesType<SSLogType>): log is SSLogDataType => {
    return log.type === 'data';
}


/**
 * Schemas
 */
//Generic schemas
const zIntNonNegative = z.number().int().nonnegative();
const zNumberNonNegative = z.number().nonnegative();

//Last perf stuff
export const SSPerfBoundariesSchema = z.array(z.union([
    zNumberNonNegative,
    z.literal('+Inf'),
]));

export const SSPerfCountsThreadSchema = z.object({
    count: zIntNonNegative,
    buckets: z.array(zIntNonNegative).length(PERF_DATA_BUCKET_COUNT),
});

export const SSPerfCountsSchema = z.object({
    svSync: SSPerfCountsThreadSchema,
    svNetwork: SSPerfCountsThreadSchema,
    svMain: SSPerfCountsThreadSchema,
});

//Log stuff
export const SSPerfHistThreadSchema = z.object({
    //NOTE: tick count is used to re-combine the logs after X hours for optimization
    count: zIntNonNegative,
    freqs: z.array(zNumberNonNegative).length(PERF_DATA_BUCKET_COUNT),
});

export const SSPerfHistSchema = z.object({
    svSync: SSPerfHistThreadSchema,
    svNetwork: SSPerfHistThreadSchema,
    svMain: SSPerfHistThreadSchema,
});

export const SSLogDataSchema = z.object({
    ts: zIntNonNegative,
    type: z.literal('data'),
    players: zIntNonNegative,
    fxsMemory: zNumberNonNegative.nullable(),
    nodeMemory: zNumberNonNegative.nullable(),
    perf: SSPerfHistSchema,
});

export const SSLogSvBootSchema = z.object({
    ts: zIntNonNegative,
    type: z.literal('svBoot'),
    bootTime: zIntNonNegative,
});

export const SSLogSvCloseSchema = z.object({
    ts: zIntNonNegative,
    type: z.literal('svClose'),
    reason: z.string(),
});

export const SSFileSchema = z.object({
    version: z.literal(1),
    lastPerfBoundaries: SSPerfBoundariesSchema.optional(),
    log: z.array(z.union([SSLogDataSchema, SSLogSvBootSchema, SSLogSvCloseSchema])),
});

export const LogNodeHeapEventSchema = z.object({
    heapUsed: zIntNonNegative,
    heapTotal: zIntNonNegative,
});


//Exporting types
export type SSFileType = z.infer<typeof SSFileSchema>;
export type SSLogSvCloseType = z.infer<typeof SSLogSvCloseSchema>;
export type SSLogSvBootType = z.infer<typeof SSLogSvBootSchema>;
export type SSLogDataType = z.infer<typeof SSLogDataSchema>;
export type SSLogType = (SSLogSvCloseType | SSLogSvBootType | SSLogDataType)[];
export type SSPerfHistType = z.infer<typeof SSPerfHistSchema>;
export type SSPerfCountsType = z.infer<typeof SSPerfCountsSchema>;
export type SSPerfBoundariesType = z.infer<typeof SSPerfBoundariesSchema>;
export type LogNodeHeapEventType = z.infer<typeof LogNodeHeapEventSchema>;
