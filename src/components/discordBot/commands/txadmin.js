//Requires
const modulename = 'DiscordBot:cmd:txadmin';
const { MessageEmbed } = require('@citizenfx/discord.js');
const { dir, log, logOk, logWarn, logError } = require('../../../extras/console')(modulename);
const packageJSON = require("./package.json");
const discordJSVersion = packageJSON.dependencies["discord.js"];
module.exports = {
    description: 'Prints the current txAdmin version',
    async execute(message, args) {
        const outMsg = new MessageEmbed({
            color: 0x4DEEEA,
            title: `${globals.config.serverName} uses txAdmin v${GlobalData.txAdminVersion} & I'm running ${discordJSVersion} :smiley:`,
            description: 'Checkout the project:\n GitHub: https://github.com/tabarra/txAdmin\n Discord: https://discord.gg/f3TsfvD',
        });
        return await message.reply({embeds: [outMsg]});
    },
};
