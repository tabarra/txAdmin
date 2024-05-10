const noLookAlikesAlphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZ'; //i,o removed
export default {
    //Identifier stuff
    regexValidHwidToken: /^(?=.{31,}).*$/,
    validIdentifiers: {
        // https://github.com/discordjs/discord.js/pull/9144
        // validated in txtracker dataset
        discord: /^discord:\d{17,20}$/,
        fivem: /^fivem:\d{1,8}$/,
        license: /^license:/,
        license2: /^license2:/,
        live: /^live:\d{14,20}$/,
        steam: /^steam:1100001[0-9A-Fa-f]{8}$/,
        xbl: /^xbl:\d{14,20}$/,
    },
    validIdentifierParts: {
        discord: /^\d{17,20}$/,
        fivem: /^\d{1,8}$/,
        license: /.{12,}/,
        license2: /.{12,}/,
        live: /^\d{14,20}$/,
        steam: /^1100001[0-9A-Fa-f]{8}$/,
        xbl: /^\d{14,20}$/,
    },

    // Database stuff
    adminPasswordMinLength: 6,
    adminPasswordMaxLength: 128,
    regexActionID: new RegExp(`^[${noLookAlikesAlphabet}]{4}-[${noLookAlikesAlphabet}]{4}$`),
    regexWhitelistReqID: new RegExp(`R[${noLookAlikesAlphabet}]{4}`),

    //Other stuff
    regexSvLicenseOld: /^\w{32}$/,
    regexSvLicenseNew: /^cfxk_\w{1,60}_\w{1,20}$/,
    regexValidIP: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
    noLookAlikesAlphabet,
    nuiWebpipePath: 'https://monitor/WebPipe/',
    regexCustomThemeName: /^[a-z0-9]+(-[a-z0-9]+)*$/
} as const;
