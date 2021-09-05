//Requires
const modulename = 'DiscordBot:cmd:status';
const humanizeDuration = require('humanize-duration');
const { RichEmbed } = require('@tabarra/discord');
const { dir, log, logOk, logWarn, logError } = require('../../../extras/console')(modulename);

module.exports = {
    description: 'Prints the server status',
    cooldown: 60,
    async execute(message, args) {
        //Prepare message's RichEmbed + template variables
        let replaces = {};
        let cardColor, cardTitle;
        if (globals['sv1.profile'].monitor.currentStatus == 'ONLINE' || globals['sv1.profile'].monitor.currentStatus == 'PARTIAL') {
            cardColor = 0x74EE15;
            cardTitle = universal.translator.t('discord.status_online', {servername: globals['sv1.profile'].config.serverName});
            replaces.players = (Array.isArray(globals['sv1.profile'].playerController.activePlayers)) ? globals['sv1.profile'].playerController.activePlayers.length : '--';
            replaces.port = (globals['sv1.profile'].config.forceFXServerPort) ? globals['sv1.profile'].config.forceFXServerPort : globals['sv1.profile'].fxRunner.fxServerPort;
        } else {
            cardColor = 0xFF001E;
            cardTitle = universal.translator.t('discord.status_offline', {servername: globals['sv1.profile'].config.serverName});
            replaces.players = '--';
            replaces.port = '--';
        }
        let humanizeOptions = {
            language: universal.translator.t('$meta.humanizer_language'),
            round: true,
            units: ['d', 'h', 'm', 's'],
            fallbacks: ['en'],
        };
        replaces.uptime = humanizeDuration(globals['sv1.profile'].fxRunner.getUptime() * 1000, humanizeOptions);

        //Replacing text
        let desc = universal.discordBot.config.statusMessage;
        Object.entries(replaces).forEach(([key, value]) => {
            desc = desc.replace(`<${key}>`, value);
        });

        //Prepare object
        const outMsg = new RichEmbed({
            color: cardColor,
            title: cardTitle,
            description: desc,
            footer: `Powered by txAdmin v${GlobalData.txAdminVersion}.`,
        });
        return await message.channel.send(outMsg);
    },
};
