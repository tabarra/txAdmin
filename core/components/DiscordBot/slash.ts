import { ApplicationCommandDataResolvable } from 'discord.js';
import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';
import { ApplicationCommandOptionType, ApplicationCommandType } from './extractedEnums';


const statusCommand: ApplicationCommandDataResolvable = {
    type: ApplicationCommandType.ChatInput as number,
    name: 'status',
    description: 'Status embed commands;',
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand as number,
            name: 'add',
            description: 'Creates a configurable, persistent, auto-updated embed with server status.'
        },
        {
            type: ApplicationCommandOptionType.Subcommand as number,
            name: 'remove',
            description: 'Removes the configured persistent txAdmin status embed.'
        }
    ]
}

const whitelistCommand: ApplicationCommandDataResolvable = {
    type: ApplicationCommandType.ChatInput as number,
    name: 'whitelist',
    description: 'Status embed commands;',
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand as number,
            name: 'member',
            description: 'Adds a member to the whitelist approvals.',
            options: [
                {
                    type: 'USER',
                    name: 'member',
                    description: 'The member that will be whitelisted.',
                    required: true,
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand as number,
            name: 'request',
            description: 'Approves a whitelist request ID (eg R1234).',
            options: [
                {
                    type: 'STRING',
                    name: 'id',
                    description: 'The ID of the request (eg R1234).',
                    required: true,
                    minLength: 5,
                    maxLength: 5,
                }
            ]
        }
    ]
}

/**
 * Exported commands
 */
export default [
    statusCommand,
    whitelistCommand,
] as ApplicationCommandDataResolvable[];
