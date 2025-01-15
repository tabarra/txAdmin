type RawConvarSetTuple = [setter: string, name: string, value: any];
type ConvarSetTuple = [setter: string, name: string, value: string];

const polishConvarSetTuple = ([setter, name, value]: RawConvarSetTuple, isCmdLine = false): ConvarSetTuple => {
    return [
        isCmdLine ? `+${setter}` : setter,
        'txAdmin-' + name,
        value.toString(),
    ];
}

export const getMutableConvars = (isCmdLine = false) => {
    const checkPlayerJoin = txConfig.banlist.enabled || txConfig.whitelist.mode !== 'disabled';
    const convars: RawConvarSetTuple[] = [
        ['setr', 'locale', txConfig.general.language ?? 'en'],
        ['set', 'localeFile', txCore.translator.customLocalePath],
        ['set', 'serverName', txConfig.general.serverName ?? 'txAdmin'],
        ['set', 'checkPlayerJoin', checkPlayerJoin],
        ['set', 'menuAlignRight', txConfig.gameFeatures.menuAlignRight],
        ['set', 'menuPageKey', txConfig.gameFeatures.menuPageKey],
        ['set', 'playerModePtfx', txConfig.gameFeatures.playerModePtfx],
        ['set', 'hideAdminInPunishments', txConfig.gameFeatures.hideAdminInPunishments],
        ['set', 'hideAdminInMessages', txConfig.gameFeatures.hideAdminInMessages],
        ['set', 'hideDefaultAnnouncement', txConfig.gameFeatures.hideDefaultAnnouncement],
        ['set', 'hideDefaultDirectMessage', txConfig.gameFeatures.hideDefaultDirectMessage],
        ['set', 'hideDefaultWarning', txConfig.gameFeatures.hideDefaultWarning],
        ['set', 'hideDefaultScheduledRestartWarning', txConfig.gameFeatures.hideDefaultScheduledRestartWarning],

        // //NOTE: no auto update, maybe we shouldn't tie core and server verbosity anyways
        // ['setr', 'verbose', console.isVerbose],
    ];
    return convars.map((c) => polishConvarSetTuple(c, isCmdLine));
};

export const mutableConvarConfigDependencies = [
    'general.*',
    'gameFeatures.*',
    'banlist.enabled',
    'whitelist.mode',
];
