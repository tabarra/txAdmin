import { ApplicationCommandDataResolvable } from 'discord.js';
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
    description: 'Status embed commands.',
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

const infoCommand: ApplicationCommandDataResolvable = {
    type: ApplicationCommandType.ChatInput as number,
    name: 'info',
    description: 'Searches for a player in the txAdmin Database and prints information.',
    options: [
        {
            type: ApplicationCommandOptionType.Subcommand as number,
            name: 'self',
            description: 'Searches for whomever is using the command.',
        },
        {
            type: ApplicationCommandOptionType.Subcommand as number,
            name: 'member',
            description: 'Searches for a player with matching Discord ID.',
            options: [
                {
                    type: 'USER',
                    name: 'member',
                    description: 'The member that will be searched for.',
                    required: true,
                },
                {
                    type: 'BOOLEAN',
                    name: 'admininfo',
                    description: 'For admins to show identifiers and history information.'
                }
            ]
        },
        {
            type: ApplicationCommandOptionType.Subcommand as number,
            name: 'id',
            description: 'Searches for an identifier.',
            options: [
                {
                    type: 'STRING',
                    name: 'id',
                    description: 'The ID to search for (eg fivem:271816).',
                    required: true,
                    minLength: 5,
                },
                {
                    type: 'BOOLEAN',
                    name: 'admininfo',
                    description: 'For admins to show identifiers and history information.'
                }
            ]
        },
    ]
}

/**
 * Exported commands
 */
export default [
    statusCommand,
    whitelistCommand,
    infoCommand,
] as ApplicationCommandDataResolvable[];
