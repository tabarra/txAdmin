import { z } from "zod";
import { typeDefinedConfig, SYM_FIXER_DEFAULT } from "./utils";
import consts from "@shared/consts";


const mode = typeDefinedConfig({
    default: 'disabled',
    validator: z.enum(['disabled', 'adminOnly', 'guildMember', 'guildRoles', 'approvedLicense']),
    fixer: SYM_FIXER_DEFAULT,
});

const rejectionMessage = typeDefinedConfig({
    default: 'Please join http://discord.gg/example and request to be whitelisted.',
    validator: z.string(),
    fixer: SYM_FIXER_DEFAULT,
});

export const polishDiscordRolesArray = (input: string[]) => {
    const unique = [...new Set(input)];
    unique.sort((a, b) => Number(a) - Number(b));
    return unique;
}

const discordRoles = typeDefinedConfig({
    default: [],
    validator: z.string().regex(consts.regexDiscordSnowflake).array().transform(polishDiscordRolesArray),
    fixer: (input: any) => {
        if (!Array.isArray(input)) return [];
        const valid = input.filter(item => consts.regexDiscordSnowflake.test(item));
        return polishDiscordRolesArray(valid);
    },
});


export default {
    mode,
    rejectionMessage,
    discordRoles,
} as const;
