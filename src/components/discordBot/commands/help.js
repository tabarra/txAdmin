//Requires
const modulename = 'DiscordBot:cmd:help';
const { RichEmbed } = require('@tabarra/discord');
const { dir, log, logOk, logWarn, logError } = require('../../../extras/console')(modulename);

module.exports = {
    description: 'Prints a list of commands',
    async execute(message, args) {
        //Prepare description
        let cmdDescs = [];
        universal.discordBot.commands.each((cmd, name) => {
            cmdDescs.push(`${universal.discordBot.config.prefix}${name}: ${cmd.description}`);
        });
        const descLines = [
            ':game_die: **Available commands:**',
            '```',
            ...cmdDescs,
            '...more commands to come soon 😮',
            '```',
        ];
        const outMsg = new RichEmbed({
            color: 0x4287F5,
            description: descLines.join('\n'),
        });
        return await message.channel.send(outMsg);
    },
};
