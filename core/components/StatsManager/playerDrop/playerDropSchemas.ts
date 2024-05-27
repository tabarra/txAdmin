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
    newVersion: z.string(), //eg: linux:7999
});
export const PDLGameChangedEventSchema = z.object({
    ts: zIntNonNegative,
    type: z.literal('gameChanged'),
    newVersion: z.string(), //eg: gta5:1604
});
export const PDLResourcesChangedEventSchema = z.object({
    ts: zIntNonNegative,
    type: z.literal('resourcesChanged'),
    resAdded: z.array(z.string().min(1)),
    resRemoved: z.array(z.string().min(1)),
});
// export const PDLClientChangedEventSchema = z.object({
//     ts: zIntNonNegative,
//     type: z.literal('clientChanged'),
//     newVersion: z.string(),
// });

export const PDLHourlyRawSchema = z.object({
    hour: z.string(),
    changes: z.array(z.union([
        PDLFxsChangedEventSchema,
        PDLGameChangedEventSchema,
        PDLResourcesChangedEventSchema,
        // PDLClientChangedEventSchema
    ])),
    dropTypes: z.array(z.tuple([z.string(), z.number()])),
    crashTypes: z.array(z.tuple([z.string(), z.number()])),
});

export const PDLFileSchema = z.object({
    version: z.literal(1),
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
export type PDLHourlyChanges = PDLHourlyRawType['changes'];

export type PDLHourlyType = {
    hour: DeepReadonly<ReturnType<typeof parseDateHourEnc>>;
    changes: PDLHourlyChanges;
    dropTypes: MultipleCounter;
    crashTypes: MultipleCounter;
};
