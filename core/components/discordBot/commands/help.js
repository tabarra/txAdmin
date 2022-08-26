const modulename = 'DiscordBot:cmd:help';
import { MessageEmbed } from '@citizenfx/discord.js';
import logger from '@core/extras/console.js';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

export default {
    description: 'Prints a list of commands',
    async execute(message, args) {
        //Prepare description
        let cmdDescs = [];
        globals.discordBot.commands.forEach((cmd, name) => {
            cmdDescs.push(`${globals.discordBot.config.prefix}${name}: ${cmd.description}`);
        });
        const descLines = [
            ':game_die: **Available commands:**',
            '```',
            ...cmdDescs,
            '...more commands to come soon 😮',
            '```',
        ];
        const outMsg = new MessageEmbed({
            color: 0x4287F5,
            description: descLines.join('\n'),
        });
        return await message.reply({embeds: [outMsg]});
    },
};
