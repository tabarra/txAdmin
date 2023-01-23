export const defaultEmbedJson = JSON.stringify({
    "title": "{{serverName}}",
    "url": "{{serverBrowserUrl}}",
    "description": "You can configure this embed in `txAdmin > Settings > Discord Bot`, and edit everything from it (except footer).",
    "fields": [
        {
            "name": "> STATUS",
            "value": "```\n{{statusString}}\n```",
            "inline": true
        },
        {
            "name": "> PLAYERS",
            "value": "```\n{{serverClients}}/{{serverMaxClients}}\n```",
            "inline": true
        },
        {
            "name": "> F8 CONNECT COMMAND",
            "value": "```\nconnect 123.123.123.123\n```"
        },
        {
            "name": "> NEXT RESTART",
            "value": "```\n{{nextScheduledRestart}}\n```",
            "inline": true
        },
        {
            "name": "> UPTIME",
            "value": "```\n{{uptime}}\n```",
            "inline": true
        }
    ],
    "image": {
        "url": "https://i.imgur.com/ZZRp4pj.png"
    },
    "thumbnail": {
        "url": "https://i.imgur.com/9i9lvOp.png"
    }
}, null, 2);

export const defaultEmbedConfigJson = JSON.stringify({
    "onlineString": "🟢 Online",
    "onlineColor": "#0BA70B",
    "partialString": "🟡 Partial",
    "partialColor": "#FFF100",
    "offlineString": "🔴 Offline",
    "offlineColor": "#A70B28",
    "buttons": [
        {
            "emoji": "1062338355909640233",
            "label": "Connect",
            "url": "{{serverJoinUrl}}"
        },
        {
            "emoji": "1062339910654246964",
            "label": "txAdmin Discord",
            "url": "https://discord.gg/txAdmin"
        },
        {
            "emoji": "😏",
            "label": "ZAP-Hosting",
            "url": "https://zap-hosting.com/txadmin6"
        }
    ]
}, null, 2);
