import { z } from "zod";
import { typeDefinedConfig } from "./utils";

import { alphanumeric } from 'nanoid-dictionary';
import { customAlphabet } from "nanoid";
import { SYM_FIXER_DEFAULT, SYM_FIXER_FATAL } from "@lib/symbols";




/**
 * MARK: Ban templates
 */
export const BAN_TEMPLATE_ID_LENGTH = 21;

export const genBanTemplateId = customAlphabet(alphanumeric, BAN_TEMPLATE_ID_LENGTH);

export const BanDurationTypeSchema = z.union([
    z.literal('permanent'),
    z.object({
        value: z.number().positive(),
        unit: z.enum(['hours', 'days', 'weeks', 'months']),
    }),
]);
export type BanDurationType = z.infer<typeof BanDurationTypeSchema>;

export const BanTemplatesDataSchema = z.object({
    id: z.string().length(BAN_TEMPLATE_ID_LENGTH), //nanoid fixed at 21 chars
    reason: z.string().min(3).max(2048), //should be way less, but just in case
    duration: BanDurationTypeSchema,
});
export type BanTemplatesDataType = z.infer<typeof BanTemplatesDataSchema>;

//Ensure all templates have unique ids
export const polishBanTemplatesArray = (input: BanTemplatesDataType[]) => {
    const ids = new Set();
    const unique: BanTemplatesDataType[] = [];
    for (const template of input) {
        if (ids.has(template.id)) {
            unique.push({
                ...template,
                id: genBanTemplateId(),
            });
        } else {
            unique.push(template);
        }
        ids.add(template.id);
    }
    return unique;
}



/**
 * MARK: Default
 */
const enabled = typeDefinedConfig({
    name: 'Ban Checking Enabled',
    default: true,
    validator: z.boolean(),
    fixer: SYM_FIXER_DEFAULT,
});

const rejectionMessage = typeDefinedConfig({
    name: 'Ban Rejection Message',
    default: 'You can join http://discord.gg/example to appeal this ban.',
    validator: z.string(),
    fixer: SYM_FIXER_DEFAULT,
});

const requiredHwidMatches = typeDefinedConfig({
    name: 'Required Ban HWID Matches',
    default: 1,
    validator: z.number().int().min(0),
    fixer: SYM_FIXER_DEFAULT,
});

const templates = typeDefinedConfig({
    name: 'Ban Templates',
    default: [],
    validator: BanTemplatesDataSchema.array().transform(polishBanTemplatesArray),
    //NOTE: if someone messed with their templates and broke it, we don't want to wipe it all out
    fixer: SYM_FIXER_FATAL,
});


export default {
    enabled,
    rejectionMessage,
    requiredHwidMatches,
    templates,
} as const;
