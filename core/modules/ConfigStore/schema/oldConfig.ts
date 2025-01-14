

import type { StoredTxConfigs } from "./index";


export const restructureOldConfig = (old: any) => {
    //Apply the legacy migrations (mutation)
    old.playerDatabase ??= old.playerDatabase ?? old.playerController ?? {};
    if (old.global.language === 'pt_PT' || old.global.language === 'pt_BR') {
        old.global.language = 'pt';
    }
    if (typeof old.monitor.resourceStartingTolerance === 'string') {
        old.monitor.resourceStartingTolerance = parseInt(old.monitor.resourceStartingTolerance);
        if (isNaN(old.monitor.resourceStartingTolerance)) {
            old.monitor.resourceStartingTolerance = 120;
        }
    }

    //Remap the old config to the new structure
    const remapped: StoredTxConfigs = {
        general: { //NOTE:renamed
            serverName: old?.global?.serverName,
            language: old?.global?.language,
        },
        webServer: {
            disableNuiSourceCheck: old?.webServer?.disableNuiSourceCheck,
            limiterMinutes: old?.webServer?.limiterMinutes,
            limiterAttempts: old?.webServer?.limiterAttempts,
        },
        discordBot: {
            enabled: old?.discordBot?.enabled,
            token: old?.discordBot?.token,
            guild: old?.discordBot?.guild,
            warningsChannel: old?.discordBot?.announceChannel, //NOTE:renamed
            embedJson: old?.discordBot?.embedJson,
            embedConfigJson: old?.discordBot?.embedConfigJson,
        },
        server: {//NOTE:renamed
            dataPath: old?.fxRunner?.serverDataPath, //NOTE:renamed
            cfgPath: old?.fxRunner?.cfgPath,
            startupArgs: old?.fxRunner?.commandLine, //NOTE:renamed
            onesync: old?.fxRunner?.onesync,
            autoStart: old?.fxRunner?.autostart, //NOTE:renamed
            quiet: old?.fxRunner?.quiet,
            shutdownNoticeDelayMs: old?.fxRunner?.shutdownNoticeDelay, //NOTE:renamed
            restartSpawnDelayMs: old?.fxRunner?.restartDelay, //NOTE:renamed
        },
        restarter: {
            schedule: old?.monitor?.restarterSchedule,  //NOTE:renamed
            bootCooldown: old?.monitor?.cooldown, //NOTE:renamed
            resourceStartingTolerance: old?.monitor?.resourceStartingTolerance,
        },
        banlist: { //NOTE: All Renamed
            enabled: old?.playerDatabase?.onJoinCheckBan,
            rejectionMessage: old?.playerDatabase?.banRejectionMessage,
            requiredHwidMatches: old?.playerDatabase?.requiredBanHwidMatches,
            templates: old?.banTemplates,
        },
        whitelist: { //NOTE: All Renamed
            mode: old?.playerDatabase?.whitelistMode,
            rejectionMessage: old?.playerDatabase?.whitelistRejectionMessage,
            discordRoles: old?.playerDatabase?.whitelistedDiscordRoles,
        },
        gameFeatures: {
            menuEnabled: old?.global?.menuEnabled,
            menuAlignRight: old?.global?.menuAlignRight,
            menuPageKey: old?.global?.menuPageKey,
            hideAdminInPunishments: old?.global?.hideAdminInPunishments,
            hideAdminInMessages: old?.global?.hideAdminInMessages,
            hideDefaultAnnouncement: old?.global?.hideDefaultAnnouncement,
            hideDefaultDirectMessage: old?.global?.hideDefaultDirectMessage,
            hideDefaultWarning: old?.global?.hideDefaultWarning,
            hideDefaultScheduledRestartWarning: old?.global?.hideDefaultScheduledRestartWarning,
        },
        logger: old?.logger,
    }

    return remapped;
};
