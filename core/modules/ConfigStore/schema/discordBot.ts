import { z } from "zod";
import { typeDefinedConfig, typeNullableConfig } from "./utils";
import consts from "@shared/consts";
import { defaultEmbedConfigJson, defaultEmbedJson } from "@modules/DiscordBot/defaultJsons";
import { SYM_FIXER_DEFAULT } from "../configSymbols";


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


//We are not validating the JSON, only that it is a string
export const attemptMinifyJsonString = (input: string) => {
    try {
        return JSON.stringify(JSON.parse(input));
    } catch (error) {
        return input;
    }
};

const embedJson = typeDefinedConfig({
    default: defaultEmbedJson,
    validator: z.string().min(1).transform(attemptMinifyJsonString),
    //NOTE: no true valiation in here, done in the module only
    fixer: SYM_FIXER_DEFAULT,
});

const embedConfigJson = typeDefinedConfig({
    default: defaultEmbedConfigJson,
    validator: z.string().min(1).transform(attemptMinifyJsonString),
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
