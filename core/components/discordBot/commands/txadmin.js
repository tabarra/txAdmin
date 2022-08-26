const modulename = 'DiscordBot:cmd:txadmin';
import { MessageEmbed } from '@citizenfx/discord.js';
import logger from '@core/extras/console.js';
import { txEnv } from '@core/globalData.js';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

export default {
    description: 'Prints the current txAdmin version',
    async execute(message, args) {
        const outMsg = new MessageEmbed({
            color: 0x4DEEEA,
            title: `${globals.config.serverName} uses txAdmin v${txEnv.txAdminVersion} :smiley:`,
            description: 'Checkout the project:\n GitHub: https://github.com/tabarra/txAdmin\n Discord: https://discord.gg/f3TsfvD',
        });
        return await message.reply({embeds: [outMsg]});
    },
};
