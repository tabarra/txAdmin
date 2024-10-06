import * as z from 'zod';
import type { MultipleCounter } from '../statsUtils';
import { parseDateHourEnc } from './playerDropUtils';
import { DeepReadonly } from 'utility-types';


//Generic schemas
const zIntNonNegative = z.number().int().nonnegative();

//handleServerBootData that comes from txAdmin.loggers.server when the server boots
export const PDLServerBootDataSchema = z.object({
    gameName: z.string().min(1).default('unknown'),
    gameBuild: z.string().min(1).default('unknown'),
    fxsVersion: z.string().min(1).default('unknown'),
    resources: z.array(z.string().min(1)),
    projectName: z.string().optional(),
});


//Log stuff
export const PDLFxsChangedEventSchema = z.object({
    ts: zIntNonNegative,
    type: z.literal('fxsChanged'),
    oldVersion: z.string(),
    newVersion: z.string(),
});
export const PDLGameChangedEventSchema = z.object({
    ts: zIntNonNegative,
    type: z.literal('gameChanged'),
    oldVersion: z.string(),
    newVersion: z.string(),
});
export const PDLResourcesChangedEventSchema = z.object({
    ts: zIntNonNegative,
    type: z.literal('resourcesChanged'),
    resAdded: z.array(z.string().min(1)),
    resRemoved: z.array(z.string().min(1)),
});

export const PDLHourlyRawSchema = z.object({
    hour: z.string(),
    changes: z.array(z.union([
        PDLFxsChangedEventSchema,
        PDLGameChangedEventSchema,
        PDLResourcesChangedEventSchema,
    ])),
    crashTypes: z.array(z.tuple([z.string(), z.number()])),
    dropTypes: z.array(z.tuple([z.string(), z.number()])),
    resKicks: z.array(z.tuple([z.string(), z.number()])),
});

export const PDLFileSchema = z.object({
    version: z.literal(2),
    emptyReason: z.string().optional(), //If the log is empty, this will be the reason
    lastGameVersion: z.string(),
    lastServerVersion: z.string(),
    lastResourceList: z.array(z.string()),
    lastUnknownReasons: z.array(z.string()), //store the last few for potential analysis
    log: z.array(PDLHourlyRawSchema),
});


//Exporting types
export type PDLFileType = z.infer<typeof PDLFileSchema>;
export type PDLHourlyRawType = z.infer<typeof PDLHourlyRawSchema>;
export type PDLFxsChangedEventType = z.infer<typeof PDLFxsChangedEventSchema>;
export type PDLGameChangedEventType = z.infer<typeof PDLGameChangedEventSchema>;
export type PDLResourcesChangedEventType = z.infer<typeof PDLResourcesChangedEventSchema>;
// export type PDLClientChangedEventType = z.infer<typeof PDLClientChangedEventSchema>;
export type PDLChangeEventType = (PDLFxsChangedEventType | PDLGameChangedEventType | PDLResourcesChangedEventType);
export type PDLHourlyChanges = PDLHourlyRawType['changes'];

//Used after parsing (getCurrentLogHourRef)
export type PDLHourlyType = {
    hour: DeepReadonly<ReturnType<typeof parseDateHourEnc>>;
    changes: PDLHourlyChanges;
    crashTypes: MultipleCounter;
    dropTypes: MultipleCounter;
    resKicks: MultipleCounter;
};


/**
 * Migration schemas from v1 to v2 with changes:
 * - added "oldVersion" to the fxsChanged and gameChanged events
 * - removed the "Game crashed: " prefix from crash reasons
 */
export const PDLFxsChangedEventSchema_v1 = PDLFxsChangedEventSchema.omit({
    oldVersion: true,
});
export const PDLGameChangedEventSchema_v1 = PDLGameChangedEventSchema.omit({
    oldVersion: true,
});
export const PDLHourlyRawSchema_v1 = PDLHourlyRawSchema.extend({
    changes: z.array(z.union([
        PDLFxsChangedEventSchema_v1,
        PDLGameChangedEventSchema_v1,
        PDLResourcesChangedEventSchema,
    ])),
}).omit({
    resKicks: true,
});
export const PDLFileSchema_v1 = PDLFileSchema.extend({
    version: z.literal(1),
    log: z.array(PDLHourlyRawSchema_v1),
});
export type PDLFileType_v1 = z.infer<typeof PDLFileSchema_v1>;

//Used only in scripts/dev/makeOldStatsFile.ts
export type PDLChangeEventType_V1 = (
    z.infer<typeof PDLFxsChangedEventSchema_v1>
    | z.infer<typeof PDLGameChangedEventSchema_v1>
    | PDLResourcesChangedEventType
);
