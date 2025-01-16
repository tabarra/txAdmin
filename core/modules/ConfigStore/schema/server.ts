import { z } from "zod";
import { typeDefinedConfig, typeNullableConfig } from "./utils";
import { SYM_FIXER_DEFAULT, SYM_FIXER_FATAL } from "../configSymbols";


const dataPath = typeNullableConfig({
    default: null,
    validator: z.string().min(1).nullable(),
    fixer: SYM_FIXER_FATAL,
});

const cfgPath = typeDefinedConfig({
    default: './server.cfg',
    validator: z.string().min(1),
    fixer: SYM_FIXER_FATAL,
});

const startupArgs = typeDefinedConfig({
    default: [],
    validator: z.string().array(),
    fixer: SYM_FIXER_DEFAULT,
});

const onesync = typeDefinedConfig({
    default: 'on',
    validator: z.enum(['on', 'legacy', 'off']),
    fixer: SYM_FIXER_FATAL,
});

const autoStart = typeDefinedConfig({
    default: true,
    validator: z.boolean(),
    fixer: SYM_FIXER_DEFAULT,
});

const quiet = typeDefinedConfig({
    default: false,
    validator: z.boolean(),
    fixer: SYM_FIXER_DEFAULT,
});

const shutdownNoticeDelayMs = typeDefinedConfig({
    default: 5000,
    validator: z.number().int().min(0).max(60_000),
    fixer: SYM_FIXER_DEFAULT,
});

const restartSpawnDelayMs = typeDefinedConfig({
    default: 500,
    validator: z.number().int().min(0).max(15_000),
    fixer: SYM_FIXER_DEFAULT,
});


export default {
    dataPath,
    cfgPath,
    startupArgs,
    onesync,
    autoStart,
    quiet,
    shutdownNoticeDelayMs,
    restartSpawnDelayMs,
} as const;
