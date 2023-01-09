const modulename = 'DiscordBot:cmd:status';
import humanizeDuration from 'humanize-duration';
import { BaseCommandInteraction, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';
import logger, { ogConsole } from '@core/extras/console.js';
import { txEnv } from '@core/globalData';
import TxAdmin from '@core/txAdmin';
const { dir, log, logOk, logWarn, logError } = logger(modulename);



// MessageButtonStyles
const MessageButtonStyles_PRIMARY = 1;
const MessageButtonStyles_SECONDARY = 2;
const MessageButtonStyles_SUCCESS = 3;
const MessageButtonStyles_DANGER = 4;
const MessageButtonStyles_LINK = 5;




export default async (interaction: BaseCommandInteraction, txAdmin: TxAdmin) => {

    let statusString, statusColor;
    if (txAdmin.healthMonitor.currentStatus == 'ONLINE') {
        statusString = '🟢 Online';
        statusColor = 0x0BA70B;
    } else if (txAdmin.healthMonitor.currentStatus == 'PARTIAL') {
        statusString = '🟡 Partial';
        statusColor = 0xA1A70B;
    } else if (txAdmin.healthMonitor.currentStatus == 'OFFLINE') {
        statusString = '🔴 Offline';
        statusColor = 0xA70B28;
    } else {
        statusString = 'Unknown';
        statusColor = 0x4C3539;
    }

    const embed = new MessageEmbed({
        "title": "{{serverName}}",
        "url": "https://servers.fivem.net/servers/detail/{{serverId}}",
        "color": statusColor,
        "fields": [
            {
                "name": "> STATUS",
                "value": `\`\`\`\n${statusString}\n\`\`\``,
                "inline": true
            },
            {
                "name": "> PLAYERS",
                "value": "```fix\n123/456\n```",
                "inline": true
            },
            {
                "name": "> NEXT RESTART",
                "value": "```\nin 3 hours, 59 minutes\n```"
            },
            {
                "name": "> CONNECT IP",
                "value": "```\nconnect 123.123.123.123\n```"
            }
        ],
        "footer": {
            "text": `txAdmin ${txEnv.txAdminVersion} • Updated every minute`
        },
        "image": {
            "url": "https://i.imgur.com/FAsYpQe.png"
        },
        "thumbnail": {
            "url": "https://servers-live.fivem.net/servers/icon/45yo89/-1146343723.png"
        }
    });

    const buttons = [
        new MessageButton({ //MessageButton
            // customId: 'whatever',
            label: 'whatever',
            style: MessageButtonStyles_PRIMARY,
            url: 'https://google.com/'
        })
    ]
    const row = new MessageActionRow({ components: buttons }); //MessageActionRow
    return await interaction.reply({ embeds: [embed], components: [row] });
}


//type: 'BUTTON',
// emoji: '791692679419265044',
