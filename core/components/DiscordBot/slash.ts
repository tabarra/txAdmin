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

/**
 * Exported commands
 */
export default [
    statusCommand,
] as ApplicationCommandDataResolvable[];
