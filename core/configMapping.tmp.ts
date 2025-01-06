export const tmpMapOldConfigToNew = (old: TxAdminConfigsOld) => ({
    //General stuff
    /*[x]*/ general: { //NOTE:renamed
        /*[x]*/ serverName: old.global.serverName,
        /*[x]*/ language: old.global.language,
    },
    /*[x]*/ webServer: {
        /*[x]*/ disableNuiSourceCheck: old.webServer.disableNuiSourceCheck,
        /*[x]*/ limiterMinutes: old.webServer.limiterMinutes,
        /*[x]*/ limiterAttempts: old.webServer.limiterAttempts,
    },
    /*[!]*/ logger: old.logger, //FIXME:depth
    /*[x]*/ discordBot: {
        /*[x]*/ enabled: old.discordBot.enabled,
        /*[x]*/ token: old.discordBot.token,
        /*[x]*/ guild: old.discordBot.guild,
        /*[x]*/ warningsChannel: old.discordBot.announceChannel, //NOTE:renamed
        /*[x]*/ embedJson: old.discordBot.embedJson, //FIXME:depth save as object
        /*[!]*/ embedConfigJson: old.discordBot.embedConfigJson, //FIXME:depth save as object
    },

    //Server stuff
    /*[x]*/ fxRunner: {
        /*[x]*/ dataPath: old.fxRunner.serverDataPath, //NOTE:renamed
        /*[x]*/ cfgPath: old.fxRunner.cfgPath,
        /*[x]*/ startupArgs: old.fxRunner.commandLine, //NOTE:renamed 2x (extraArgs)

        /*[x]*/ onesync: old.fxRunner.onesync,
        /*[x]*/ autoStart: old.fxRunner.autostart, //NOTE:renamed
        /*[x]*/ quiet: old.fxRunner.quiet,

        /*[x]*/ shutdownNoticeDelayMs: old.fxRunner.shutdownNoticeDelay, //NOTE:renamed
        /*[x]*/ restartSpawnDelayMs: old.fxRunner.restartDelay, //NOTE:renamed
        /*[!]*/ logPath: old.fxRunner.logPath, //FIXME: DEPRECATE THIS, PULL VALUE FROM LOGGER
    },
    /*[x]*/ restarter: {
        /*[x]*/ schedule: old.monitor.restarterSchedule,  //NOTE:renamed
        /*[x]*/ bootCooldown: old.monitor.cooldown, //NOTE:renamed
        /*[x]*/ resourceStartingTolerance: old.monitor.resourceStartingTolerance,
    },

    //NOTE: All Renamed
    /*[x]*/ banlist: {
        /*[x]*/ enabled: old.playerDatabase.onJoinCheckBan,
        /*[x]*/ rejectionMessage: old.playerDatabase.banRejectionMessage,
        /*[x]*/ requiredHwidMatches: old.playerDatabase.banRequiredHwidMatches,
        /*[ ]*/ templates: old.banTemplates, //FIXME:depth
    },

    //NOTE: All Renamed
    /*[x]*/ whitelist: {
        /*[x]*/ mode: old.playerDatabase.whitelistMode,
        /*[x]*/ rejectionMessage: old.playerDatabase.whitelistRejectionMessage,
        /*[x]*/ discordRoles: old.playerDatabase.whitelistDiscordRoles,
    },


    /*[x]*/ gameFeatures: {
        /*[x]*/ menuEnabled: old.global.menuEnabled,
        /*[x]*/ menuAlignRight: old.global.menuAlignRight,
        /*[x]*/ menuPageKey: old.global.menuPageKey,
        /*[!]*/ playerModePtfx: null, //FIXME: new config

        /*[x]*/ hideAdminInPunishments: old.global.hideAdminInPunishments,
        /*[x]*/ hideAdminInMessages: old.global.hideAdminInMessages,

        /*[x]*/ hideDefaultAnnouncement: old.global.hideDefaultAnnouncement,
        /*[x]*/ hideDefaultDirectMessage: old.global.hideDefaultDirectMessage,
        /*[x]*/ hideDefaultWarning: old.global.hideDefaultWarning,
        /*[x]*/ hideDefaultScheduledRestartWarning: old.global.hideDefaultScheduledRestartWarning,
    },
});
