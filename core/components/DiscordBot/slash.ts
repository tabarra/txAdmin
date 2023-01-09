import { ApplicationCommandDataResolvable } from 'discord.js';

//ApplicationCommandTypes
const APPCMD_CHAT_INPUT = 1
const APPCMD_USER = 2
const APPCMD_MESSAGE = 3

//ApplicationCommandOptionTypes
const APPCMD_OPT_SUB_COMMAND = 1;
const APPCMD_OPT_SUB_COMMAND_GROUP = 2;
const APPCMD_OPT_STRING = 3;
const APPCMD_OPT_INTEGER = 4;
const APPCMD_OPT_BOOLEAN = 5;
const APPCMD_OPT_USER = 6;
const APPCMD_OPT_CHANNEL = 7;
const APPCMD_OPT_ROLE = 8;
const APPCMD_OPT_MENTIONABLE = 9;
const APPCMD_OPT_NUMBER = 10;
const APPCMD_OPT_ATTACHMENT = 11;

const statusCommand: ApplicationCommandDataResolvable = {
    type: APPCMD_CHAT_INPUT,
    name: 'status',
    description: 'Status embed commands;',
    options: [
        {
            type: APPCMD_OPT_SUB_COMMAND,
            name: 'add',
            description: 'Creates a configurable, persistent, auto-updated embed with server status.'
        },
        {
            type: APPCMD_OPT_SUB_COMMAND,
            name: 'remove',
            description: 'Removes the configured persistent txAdmin status embed.'
        }
    ]
}

/**
 * Exported commands
 */
export default [
    statusCommand,
] as ApplicationCommandDataResolvable[];
