import { z } from "zod";
import { typeDefinedConfig, typeNullableConfig, SYM_FIXER_DEFAULT } from "./utils";
import consts from "@shared/consts";
import { defaultEmbedConfigJson, defaultEmbedJson } from "@modules/DiscordBot/defaultJsons";


const enabled = typeDefinedConfig({
    default: false,
    validator: z.boolean(),
    fixer: SYM_FIXER_DEFAULT,
});

const token = typeNullableConfig({
    default: null,
    validator: z.string().min(1).nullable(),
    fixer: SYM_FIXER_DEFAULT,
});

const guild = typeNullableConfig({
    default: null,
    validator: z.string().regex(consts.regexDiscordSnowflake).nullable(),
    fixer: SYM_FIXER_DEFAULT,
});

const warningsChannel = typeNullableConfig({
    default: null,
    validator: z.string().regex(consts.regexDiscordSnowflake).nullable(),
    fixer: SYM_FIXER_DEFAULT,
});

const embedJson = typeDefinedConfig({
    default: defaultEmbedJson,
    validator: z.string().min(1),
    //NOTE: no true valiation in here, done in the module only
    fixer: SYM_FIXER_DEFAULT,
});

const embedConfigJson = typeDefinedConfig({
    default: defaultEmbedConfigJson,
    validator: z.string().min(1),
    //NOTE: no true valiation in here, done in the module only
    fixer: SYM_FIXER_DEFAULT,
});


export default {
    enabled,
    token,
    guild,
    warningsChannel,
    embedJson,
    embedConfigJson,
} as const;
