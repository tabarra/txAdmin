import * as z from 'zod';


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
export const PDLPlayerDropEventSchema = z.object({
    ts: zIntNonNegative,
    type: z.literal('playerDrop'),
    category: z.string(),
    reason: z.string(),
});

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


export const PDLFileSchema = z.object({
    version: z.literal(1),
    emptyReason: z.string().optional(), //If the log is empty, this will be the reason
    lastGameVersion: z.string(),
    lastServerVersion: z.string(),
    lastResourceList: z.array(z.string()),
    log: z.array(z.union([
        PDLPlayerDropEventSchema,
        PDLFxsChangedEventSchema,
        PDLGameChangedEventSchema,
        PDLResourcesChangedEventSchema,
        // PDLClientChangedEventSchema
    ])),
});



//Exporting types
export type PDLFileType = z.infer<typeof PDLFileSchema>;
export type PDLPlayerDropEventType = z.infer<typeof PDLPlayerDropEventSchema>;
export type PDLFxsChangedEventType = z.infer<typeof PDLFxsChangedEventSchema>;
export type PDLGameChangedEventType = z.infer<typeof PDLGameChangedEventSchema>;
export type PDLResourcesChangedEventType = z.infer<typeof PDLResourcesChangedEventSchema>;
// export type PDLClientChangedEventType = z.infer<typeof PDLClientChangedEventSchema>;
export type PDLLogType = (
    PDLPlayerDropEventType
    | PDLFxsChangedEventType
    | PDLGameChangedEventType
    | PDLResourcesChangedEventType
    // | PDLClientChangedEventType
)[];
