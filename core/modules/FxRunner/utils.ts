import { redactStartupSecrets } from "@lib/misc";

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


export const debugPrintSpawnVars = (spawnVars: { bin: string, args: (string | boolean)[] }) => {
    if(!console.verbose) return; //can't console.verbose.table

    console.debug('Spawn Bin: ' + spawnVars.bin);
    const args = redactStartupSecrets(spawnVars.args.map(String))
    console.debug('Spawn Args:');
    const argsTable = [];
    let currArgs: string[] | undefined;
    for (const arg of args) {
        if (arg.startsWith('+')) {
            if (currArgs) argsTable.push(currArgs);
            currArgs = [arg];
        } else {
            if (!currArgs) currArgs = []; 
            currArgs.push(arg);
        }
    }
    if (currArgs) argsTable.push(currArgs);
    console.table(argsTable);
}
