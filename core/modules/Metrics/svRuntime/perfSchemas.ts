import * as z from 'zod';
import { PERF_DATA_BUCKET_COUNT, PERF_DATA_THREAD_NAMES, SvRtPerfThreadNamesType } from './config';
import { ValuesType } from 'utility-types';


/**
 * Type guards
 */
export const isValidPerfThreadName = (threadName: string): threadName is SvRtPerfThreadNamesType => {
    return PERF_DATA_THREAD_NAMES.includes(threadName as SvRtPerfThreadNamesType);
}
export const isSvRtLogDataType = (log: ValuesType<SvRtLogType>): log is SvRtLogDataType => {
    return log.type === 'data';
}


/**
 * Schemas
 */
//Generic schemas
const zIntNonNegative = z.number().int().nonnegative();
const zNumberNonNegative = z.number().nonnegative();

//Last perf stuff
export const SvRtPerfBoundariesSchema = z.array(z.union([
    zNumberNonNegative,
    z.literal('+Inf'),
]));

export const SvRtPerfCountsThreadSchema = z.object({
    count: zIntNonNegative,
    buckets: z.array(zIntNonNegative).length(PERF_DATA_BUCKET_COUNT),

    //NOTE: the sum is literally used for nothing,
    //could be used to calculate the tick time average though
    sum: zNumberNonNegative,
});

export const SvRtPerfCountsSchema = z.object({
    svSync: SvRtPerfCountsThreadSchema,
    svNetwork: SvRtPerfCountsThreadSchema,
    svMain: SvRtPerfCountsThreadSchema,
});

//Log stuff
export const SvRtLogDataSchema = z.object({
    ts: zIntNonNegative,
    type: z.literal('data'),
    players: zIntNonNegative,
    fxsMemory: zNumberNonNegative.nullable(),
    nodeMemory: zNumberNonNegative.nullable(),
    perf: SvRtPerfCountsSchema,
});

export const SvRtLogSvBootSchema = z.object({
    ts: zIntNonNegative,
    type: z.literal('svBoot'),
    duration: zIntNonNegative,
});

export const SvRtLogSvCloseSchema = z.object({
    ts: zIntNonNegative,
    type: z.literal('svClose'),
    reason: z.string(),
});

export const SvRtFileSchema = z.object({
    version: z.literal(1),
    lastPerfBoundaries: SvRtPerfBoundariesSchema.optional(),
    log: z.array(z.union([SvRtLogDataSchema, SvRtLogSvBootSchema, SvRtLogSvCloseSchema])),
});

export const SvRtNodeMemorySchema = z.object({
    //NOTE: technically it also has a type string, but we don't need to check it
    used: zNumberNonNegative,
    limit: zNumberNonNegative,
});


//Exporting types
export type SvRtFileType = z.infer<typeof SvRtFileSchema>;
export type SvRtLogSvCloseType = z.infer<typeof SvRtLogSvCloseSchema>;
export type SvRtLogSvBootType = z.infer<typeof SvRtLogSvBootSchema>;
export type SvRtLogDataType = z.infer<typeof SvRtLogDataSchema>;
export type SvRtLogType = (SvRtLogSvCloseType | SvRtLogSvBootType | SvRtLogDataType)[];
export type SvRtPerfCountsType = z.infer<typeof SvRtPerfCountsSchema>;
export type SvRtPerfBoundariesType = z.infer<typeof SvRtPerfBoundariesSchema>;
export type SvRtNodeMemoryType = z.infer<typeof SvRtNodeMemorySchema>;

export type SvRtPerfCountsThreadType = z.infer<typeof SvRtPerfCountsThreadSchema>;
export type SvRtLogDataFilteredType = Omit<SvRtLogDataType, 'perf'> & {
    perf: SvRtPerfCountsThreadType
};
export type SvRtLogFilteredType = (SvRtLogSvCloseType | SvRtLogSvBootType | SvRtLogDataFilteredType)[];
