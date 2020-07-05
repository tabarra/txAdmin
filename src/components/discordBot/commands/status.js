//Requires
const modulename = 'DiscordBot:cmd:status';
const humanizeDuration = require('humanize-duration');
const { RichEmbed } = require("discord.js");
const { dir, log, logOk, logWarn, logError } = require('../../../extras/console')(modulename);

module.exports = {
    description: 'Prints the server status',
    cooldown: 60,
    async execute(message, args) {
        //Prepare message's RichEmbed + template variables
        let replaces = {};
        let cardColor, cardTitle;
        if(globals.monitor.currentStatus == 'ONLINE' || globals.monitor.currentStatus == 'PARTIAL'){
            cardColor = 0x74EE15;
            cardTitle = globals.translator.t('discord.status_online', {servername: globals.config.serverName});
            replaces.players = (Array.isArray(globals.playerController.activePlayers))? globals.playerController.activePlayers.length : '--';
            replaces.port = (globals.config.forceFXServerPort)? globals.config.forceFXServerPort : globals.fxRunner.fxServerPort;
        }else{
            cardColor = 0xF000FF;
            cardTitle = globals.translator.t('discord.status_offline', {servername: globals.config.serverName});
            replaces.players = '--';
            replaces.port = '--';
        }
        let humanizeOptions = {
            language: globals.translator.t('$meta.humanizer_language'),
            round: true,
            units: ['d', 'h', 'm', 's'],
            fallbacks: ['en']
        }
        replaces.uptime = humanizeDuration(globals.fxRunner.getUptime()*1000, humanizeOptions);
        
        //Replacing text
        let desc = globals.discordBot.config.statusMessage;
        Object.entries(replaces).forEach(([key, value]) => {
            desc = desc.replace(`<${key}>`, value);
        });

        //Prepare object
        const outMsg = new RichEmbed({
            color: cardColor,
            title: cardTitle,
            description: desc,
            footer: `Powered by txAdmin v${GlobalData.txAdminVersion}.`
        });
        return await message.channel.send(outMsg);
    },
};
