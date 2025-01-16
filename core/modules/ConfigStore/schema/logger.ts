import { z } from "zod";
import { typeDefinedConfig } from "./utils";
import { SYM_FIXER_FATAL } from "../configSymbols";


/*
    The logger module passes the options to the library which is responsible for evaluating them.
    There has never been strict definitions about those settings in txAdmin.
    The only exception is setting it to false for disabling the specific logger.
    Ref: https://github.com/iccicci/rotating-file-stream#options
*/
const rfsOptionSchema = typeDefinedConfig({
    default: {},
    validator: z.union([
        z.literal(false),
        z.object({}).passthrough(),
    ]),
    //NOTE: don't fallback to default because storage issues might crash the server
    fixer: SYM_FIXER_FATAL,
});


export default {
    admin: rfsOptionSchema, //admin & some system logs
    fxserver: rfsOptionSchema, //fxserver output
    server: rfsOptionSchema, //in-game logs
} as const;
