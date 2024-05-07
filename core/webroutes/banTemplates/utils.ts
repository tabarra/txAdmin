import * as z from 'zod';


export const BanDurationTypeSchema = z.union([
    z.literal('permanent'),
    z.object({
        value: z.number().positive(),
        unit: z.enum(['hours', 'days', 'weeks', 'months']),
    }),
]);
export type BanDurationType = z.infer<typeof BanDurationTypeSchema>;


export const BanTemplatesDataSchema = z.object({
    id: z.string().length(21), //nanoid fixed at 21 chars
    reason: z.string().min(3).max(2048), //should be way less, but just in case
    duration: BanDurationTypeSchema,
});
export type BanTemplatesDataType = z.infer<typeof BanTemplatesDataSchema>;
