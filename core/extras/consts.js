const noLookAlikesAlphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export default {
    validIdentifiers: {
        steam: /^steam:1100001[0-9A-Fa-f]{8}$/,
        license: /^license:[0-9A-Fa-f]{40}$/,
        xbl: /^xbl:\d{14,20}$/,
        live: /^live:\d{14,20}$/,
        discord: /^discord:\d{7,20}$/,
        fivem: /^fivem:\d{1,8}$/,
    },
    regexSvLicenseOld: /^\w{32}$/,
    regexSvLicenseNew: /^cfxk_\w{1,60}_\w{1,20}$/,
    regexValidIP: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
    regexActionID: new RegExp(`^[${noLookAlikesAlphabet}]{4}-[${noLookAlikesAlphabet}]{4}$`),
    regexWhitelistReqID: new RegExp(`R[${noLookAlikesAlphabet}]{4}`),
    noLookAlikesAlphabet,
};
