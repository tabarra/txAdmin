import { z } from "zod";
import { typeDefinedConfig, SYM_FIXER_DEFAULT } from "./utils";
import localeMap from "@shared/localeMap";


const serverName = typeDefinedConfig({
    default: 'change-me',
    validator: z.string().min(1).max(18),
    fixer: SYM_FIXER_DEFAULT,
});

const language = typeDefinedConfig({
    default: 'en',
    validator: z.string().min(2).refine(value => {
        return value === 'custom' || localeMap[value] !== undefined;
    }, {
        message: 'Invalid language code',
    }),
    fixer: SYM_FIXER_DEFAULT,
});


export default {
    serverName,
    language,
} as const;
