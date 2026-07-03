import { z } from "zod";
import { typeDefinedConfig } from "./utils";
import { SYM_FIXER_DEFAULT } from "@lib/symbols";


const menuEnabled = typeDefinedConfig({
    name: 'Menu Enabled',
    default: true,
    validator: z.boolean(),
    fixer: SYM_FIXER_DEFAULT,
});

const menuAlignRight = typeDefinedConfig({
    name: 'Align Menu Right',
    default: false,
    validator: z.boolean(),
    fixer: SYM_FIXER_DEFAULT,
});

const menuPageKey = typeDefinedConfig({
    name: 'Menu Page Switch Key',
    default: 'Tab',
    validator: z.string().min(1),
    fixer: SYM_FIXER_DEFAULT,
});

const playerModePtfx = typeDefinedConfig({
    name: 'Player Mode Change Effect',
    default: true,
    validator: z.boolean(),
    fixer: SYM_FIXER_DEFAULT,
});

const hideAdminInPunishments = typeDefinedConfig({
    name: 'Hide Admin Name In Punishments',
    default: true,
    validator: z.boolean(),
    fixer: SYM_FIXER_DEFAULT,
});

const hideAdminInMessages = typeDefinedConfig({
    name: 'Hide Admin Name In Messages',
    default: false,
    validator: z.boolean(),
    fixer: SYM_FIXER_DEFAULT,
});

const hideDefaultAnnouncement = typeDefinedConfig({
    name: 'Hide Announcement Notifications',
    default: false,
    validator: z.boolean(),
    fixer: SYM_FIXER_DEFAULT,
});

const hideDefaultDirectMessage = typeDefinedConfig({
    name: 'Hide Direct Message Notification',
    default: false,
    validator: z.boolean(),
    fixer: SYM_FIXER_DEFAULT,
});

const hideDefaultWarning = typeDefinedConfig({
    name: 'Hide Warning Notification',
    default: false,
    validator: z.boolean(),
    fixer: SYM_FIXER_DEFAULT,
});

const hideDefaultScheduledRestartWarning = typeDefinedConfig({
    name: 'Hide Scheduled Restart Warnings',
    default: false,
    validator: z.boolean(),
    fixer: SYM_FIXER_DEFAULT,
});

const coordsRegex = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/;

const jailRoutingBucket = typeDefinedConfig({
    name: 'Jail Routing Bucket',
    default: 916,
    validator: z.number().int().min(1).max(1023),
    fixer: SYM_FIXER_DEFAULT,
});

const jailPosFivem = typeDefinedConfig({
    name: 'Jail Position (FiveM)',
    default: '459.28, -1001.85, 24.91', //Mission Row PD cell block
    validator: z.string().regex(coordsRegex, 'must be in the "x, y, z" format'),
    fixer: SYM_FIXER_DEFAULT,
});

const jailPosRedm = typeDefinedConfig({
    name: 'Jail Position (RedM)',
    default: '-276.0, 806.0, 119.38', //Valentine sheriff jail cell
    validator: z.string().regex(coordsRegex, 'must be in the "x, y, z" format'),
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
    jailRoutingBucket,
    jailPosFivem,
    jailPosRedm,
} as const;
