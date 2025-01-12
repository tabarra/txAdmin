import { z } from "zod";
import { typeDefinedConfig, SYM_FIXER_DEFAULT } from "./utils";


const disableNuiSourceCheck = typeDefinedConfig({
    default: false,
    validator: z.boolean(),
    fixer: SYM_FIXER_DEFAULT,
});

const limiterMinutes = typeDefinedConfig({
    default: 15,
    validator: z.number().int().min(1),
    fixer: SYM_FIXER_DEFAULT,
});

const limiterAttempts = typeDefinedConfig({
    default: 10,
    validator: z.number().int().min(5),
    fixer: SYM_FIXER_DEFAULT,
});


export default {
    disableNuiSourceCheck,
    limiterMinutes,
    limiterAttempts,
} as const;
