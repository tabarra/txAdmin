import { z } from "zod";
import { typeDefinedConfig, SYM_FIXER_DEFAULT } from "./utils";
import { parseSchedule, regexHoursMinutes } from "@lib/misc";

export const polishScheduleTimesArray = (input: string[]) => {
    return parseSchedule(input).valid.map((v) => v.string);
};

const schedule = typeDefinedConfig({
    default: [],
    validator: z.string().regex(regexHoursMinutes).array().transform(polishScheduleTimesArray),
    fixer: (input: any) => {
        if(!Array.isArray(input)) return [];
        return polishScheduleTimesArray(input);
    },
});

const bootCooldown = typeDefinedConfig({
    default: 15,
    validator: z.number().int().min(15),
    fixer: SYM_FIXER_DEFAULT,
});

const resourceStartingTolerance = typeDefinedConfig({
    default: 120,
    validator: z.number().int().min(30),
    fixer: SYM_FIXER_DEFAULT,
});


export default {
    schedule,
    bootCooldown,
    resourceStartingTolerance,
} as const;
