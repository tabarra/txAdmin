import { z } from "zod";
import { typeDefinedConfig, SYM_FIXER_DEFAULT } from "./utils";


const menuEnabled = typeDefinedConfig({
    default: true,
    validator: z.boolean(),
    fixer: SYM_FIXER_DEFAULT,
});

const menuAlignRight = typeDefinedConfig({
    default: false,
    validator: z.boolean(),
    fixer: SYM_FIXER_DEFAULT,
});

const menuPageKey = typeDefinedConfig({
    default: 'Tab',
    validator: z.string().min(1),
    fixer: SYM_FIXER_DEFAULT,
});

const playerModePtfx = typeDefinedConfig({
    default: true,
    validator: z.boolean(),
    fixer: SYM_FIXER_DEFAULT,
});

const hideAdminInPunishments = typeDefinedConfig({
    default: true,
    validator: z.boolean(),
    fixer: SYM_FIXER_DEFAULT,
});

const hideAdminInMessages = typeDefinedConfig({
    default: false,
    validator: z.boolean(),
    fixer: SYM_FIXER_DEFAULT,
});

const hideDefaultAnnouncement = typeDefinedConfig({
    default: false,
    validator: z.boolean(),
    fixer: SYM_FIXER_DEFAULT,
});

const hideDefaultDirectMessage = typeDefinedConfig({
    default: false,
    validator: z.boolean(),
    fixer: SYM_FIXER_DEFAULT,
});

const hideDefaultWarning = typeDefinedConfig({
    default: false,
    validator: z.boolean(),
    fixer: SYM_FIXER_DEFAULT,
});

const hideDefaultScheduledRestartWarning = typeDefinedConfig({
    default: false,
    validator: z.boolean(),
    fixer: SYM_FIXER_DEFAULT,
});


export default {
    menuEnabled,
    menuAlignRight,
    menuPageKey,
    playerModePtfx,
    hideAdminInPunishments,
    hideAdminInMessages,
    hideDefaultAnnouncement,
    hideDefaultDirectMessage,
    hideDefaultWarning,
    hideDefaultScheduledRestartWarning,
} as const;
