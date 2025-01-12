import { z } from "zod";
import { typeDefinedConfig, SYM_FIXER_DEFAULT, SYM_FIXER_FATAL } from "./utils";


/**
 * MARK: Ban templates
 */
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


/**
 * MARK: Default
 */
const enabled = typeDefinedConfig({
    default: true,
    validator: z.boolean(),
    fixer: SYM_FIXER_DEFAULT,
});

const rejectionMessage = typeDefinedConfig({
    default: 'You can join http://discord.gg/example to appeal this ban.',
    validator: z.string(),
    fixer: SYM_FIXER_DEFAULT,
});

const requiredHwidMatches = typeDefinedConfig({
    default: 1,
    validator: z.number().int().min(1),
    fixer: SYM_FIXER_DEFAULT,
});

const templates = typeDefinedConfig({
    default: [],
    validator: BanTemplatesDataSchema.array(),
    //NOTE: if someone messed with their templates and broke it, we don't want to wipe it all out
    fixer: SYM_FIXER_FATAL,
});


export default {
    enabled,
    rejectionMessage,
    requiredHwidMatches,
    templates,
} as const;
