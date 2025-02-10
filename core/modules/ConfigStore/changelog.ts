import { z } from "zod";

// Configs
const daysMs = 24 * 60 * 60 * 1000;
export const CCLOG_SIZE_LIMIT = 32;
export const CCLOG_RETENTION = 120 * daysMs;
export const CCLOG_VERSION = 1;

//Schemas
const ConfigChangelogEntrySchema = z.object({
    author: z.string().min(1),
    ts: z.number().int().nonnegative(),
    keys: z.string().array(),
});
export const ConfigChangelogFileSchema = z.object({
    version: z.literal(1),
    log: z.array(ConfigChangelogEntrySchema),
});
export type ConfigChangelogEntry = z.infer<typeof ConfigChangelogEntrySchema>;
export type ConfigChangelogFile = z.infer<typeof ConfigChangelogFileSchema>;

//Optimizer
export const truncateConfigChangelog = (log: ConfigChangelogEntry[]): ConfigChangelogEntry[] => {
    if (!log.length) return [];
    
    const now = Date.now();
    return log
        .filter(entry => (now - entry.ts) <= CCLOG_RETENTION)
        .slice(-CCLOG_SIZE_LIMIT);
}
