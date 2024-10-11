const modulename = 'WebServer:SettingsSave';
import fsp from 'node:fs/promises';
import path from 'node:path';
import slash from 'slash';
import { jsonrepair } from 'jsonrepair';
import { parseSchedule, anyUndefined } from '@core/extras/helpers';
import { resolveCFGFilePath } from '@core/extras/fxsConfigHelper';
import { generateStatusMessage } from '@core/components/DiscordBot/commands/status';
import consoleFactory from '@extras/console';
import { AuthedCtx } from '@core/components/WebServer/ctxTypes';
const console = consoleFactory(modulename);


//Helper functions
const isUndefined = (x: unknown) => (typeof x === 'undefined');

/**
 * Handle all the server control actions
 */
export default async function SettingsSave(ctx: AuthedCtx) {
    //Sanity check
    if (isUndefined(ctx.params.scope)) {
        return ctx.utils.error(400, 'Invalid Request');
    }
    let scope = ctx.params.scope;

    //Check permissions
    if (!ctx.admin.testPermission('settings.write', modulename)) {
        return ctx.send({
            type: 'danger',
            message: 'You don\'t have permission to execute this action.',
        });
    }

    //Delegate to the specific scope functions
    if (scope == 'global') {
        return await handleGlobal(ctx);
    } else if (scope == 'fxserver') {
        return await handleFXServer(ctx);
    } else if (scope == 'playerDatabase') {
        return await handlePlayerDatabase(ctx);
    } else if (scope == 'monitor') {
        return await handleMonitor(ctx);
    } else if (scope == 'discord') {
        return await handleDiscord(ctx);
    } else if (scope == 'menu') {
        return await handleMenu(ctx);
    } else {
        return ctx.send({
            type: 'danger',
            message: 'Unknown settings scope.',
        });
    }
};


//================================================================
/**
 * Handle Global settings
 */
async function handleGlobal(ctx: AuthedCtx) {
    //Sanity check
    if (
        isUndefined(ctx.request.body.serverName)
        || isUndefined(ctx.request.body.language)
    ) {
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    //Prepare body input
    const cfg = {
        serverName: ctx.request.body.serverName.trim(),
        language: ctx.request.body.language.trim(),
    };

    // Check server name length
    if (!cfg.serverName.length) {
        return ctx.send({
            type: 'danger',
            message: 'Server name cannot be empty.',
        });
    }

    //Trying to load language file
    try {
        ctx.txAdmin.translator.getLanguagePhrases(cfg.language);
    } catch (error) {
        return ctx.send({
            type: 'danger',
            markdown: true,
            message: `**Language error:** ${(error as Error).message}`
        });
    }

    //Preparing & saving config
    const newConfig = ctx.txAdmin.configVault.getScopedStructure('global');
    newConfig.serverName = cfg.serverName;
    newConfig.language = cfg.language;
    try {
        ctx.txAdmin.configVault.saveProfile('global', newConfig);
    } catch (error) {
        console.warn(`[${ctx.admin.name}] Error changing global settings.`);
        console.verbose.dir(error);
        return ctx.send({
            type: 'danger',
            markdown: true,
            message: `**Error saving the configuration file:** ${(error as Error).message}`
        });
    }

    //Sending output
    ctx.txAdmin.refreshConfig();
    ctx.txAdmin.translator.refreshConfig();
    ctx.admin.logAction('Changing global settings.');
    return ctx.send({ type: 'success', markdown: true, message: '**Global configuration saved!**' });
}


//================================================================
/**
 * Handle FXServer settings
 */
async function handleFXServer(ctx: AuthedCtx) {
    //Sanity check
    if (
        isUndefined(ctx.request.body.serverDataPath)
        || isUndefined(ctx.request.body.cfgPath)
        || isUndefined(ctx.request.body.commandLine)
        || isUndefined(ctx.request.body.onesync)
        || isUndefined(ctx.request.body.autostart)
        || isUndefined(ctx.request.body.quiet)
    ) {
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    //Prepare body input
    const cfg = {
        serverDataPath: slash(path.normalize(ctx.request.body.serverDataPath + '/')),
        cfgPath: slash(path.normalize(ctx.request.body.cfgPath)),
        commandLine: ctx.request.body.commandLine.trim(),
        onesync: ctx.request.body.onesync,
        autostart: (ctx.request.body.autostart === 'true'),
        quiet: (ctx.request.body.quiet === 'true'),
    };

    //Validating Base Path
    try {
        const resPath = path.join(cfg.serverDataPath, 'resources');
        const resStat = await fsp.stat(resPath);
        if (!resStat.isDirectory()) {
            throw new Error("Couldn't locate or read a resources folder inside of the base path.");
        }
    } catch (error) {
        const msg = cfg.serverDataPath.includes('resources')
            ? 'Looks like this path is the \'resources\' folder, but the server data path must be the folder that contains the resources folder instead of the resources folder itself.'
            : (error as Error).message;
        return ctx.send({ type: 'danger', message: `<strong>Server Data Folder error:</strong> ${msg}` });
    }

    //Validating CFG Path
    try {
        const cfgFilePath = resolveCFGFilePath(cfg.cfgPath, cfg.serverDataPath);
        const cfgFileStat = await fsp.stat(cfgFilePath);
        if (!cfgFileStat.isFile()) {
            throw new Error('The path provided is not a file');
        }
    } catch (error) {
        return ctx.send({ type: 'danger', message: `<strong>CFG Path error:</strong> ${(error as Error).message}` });
    }

    //Preparing & saving config
    const newConfig = ctx.txAdmin.configVault.getScopedStructure('fxRunner');
    const hasServerDataPathChanged = (newConfig.serverDataPath !== cfg.serverDataPath);
    newConfig.serverDataPath = cfg.serverDataPath;
    const hasCfgPathChanged = (newConfig.cfgPath !== cfg.cfgPath);
    newConfig.cfgPath = cfg.cfgPath;
    newConfig.onesync = cfg.onesync;
    newConfig.autostart = cfg.autostart;
    newConfig.quiet = cfg.quiet;
    newConfig.commandLine = cfg.commandLine;
    try {
        ctx.txAdmin.configVault.saveProfile('fxRunner', newConfig);
    } catch (error) {
        console.warn(`[${ctx.admin.name}] Error changing FXServer settings.`);
        console.verbose.dir(error);
        return ctx.send({
            type: 'danger',
            markdown: true,
            message: `**Error saving the configuration file:** ${(error as Error).message}`
        });
    }

    //Sending output
    if(hasServerDataPathChanged || hasCfgPathChanged){
        ctx.txAdmin.statsManager.playerDrop.resetLog('Server Data Path or CFG Path changed.');
    }
    ctx.txAdmin.fxRunner.refreshConfig();
    ctx.admin.logAction('Changing fxRunner settings.');
    return ctx.send({
        type: 'success',
        markdown: true,
        message: `**FXServer configuration saved!**
        You need to restart the server for the changes to take effect.`
    });
}


//================================================================
/**
 * Handle Player Database settings
 */
async function handlePlayerDatabase(ctx: AuthedCtx) {
    //Sanity check
    if (anyUndefined(
        ctx.request.body,
        ctx.request.body.onJoinCheckBan,
        ctx.request.body.whitelistMode,
        ctx.request.body.whitelistedDiscordRoles,
        ctx.request.body.whitelistRejectionMessage,
        ctx.request.body.requiredBanHwidMatches,
        ctx.request.body.banRejectionMessage,
    )) {
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    //Prepare body input
    const cfg = {
        whitelistMode: ctx.request.body.whitelistMode.trim(),
        whitelistRejectionMessage: ctx.request.body.whitelistRejectionMessage.trim(),
        onJoinCheckBan: (ctx.request.body.onJoinCheckBan === 'true'),
        requiredBanHwidMatches: parseInt(ctx.request.body.requiredBanHwidMatches),
        banRejectionMessage: ctx.request.body.banRejectionMessage.trim(),
        whitelistedDiscordRoles: ctx.request.body.whitelistedDiscordRoles
            .split(',')
            .map((x: string) => x.trim())
            .filter((x: string) => x.length),
    };

    //Validating Discord whitelisted roles
    if (cfg.whitelistMode === 'guildRoles' && !cfg.whitelistedDiscordRoles.length) {
        return ctx.send({
            type: 'danger',
            message: 'The whitelisted roles field is required when the whitelist mode is set to Discord Guild Role'
        });
    }
    const invalidRoleInputs = cfg.whitelistedDiscordRoles.filter((x: string) => !/^\d{17,20}$/.test(x));
    if (invalidRoleInputs.length) {
        return ctx.send({
            type: 'danger',
            message: `The whitelist role(s) "${invalidRoleInputs.join(', ')}" do not appear to be valid`
        });
    }

    //Validating HWID bans
    if (typeof cfg.requiredBanHwidMatches !== 'number' || isNaN(cfg.requiredBanHwidMatches)) {
        return ctx.send({ type: 'danger', message: 'requiredBanHwidMatches must be a number.' });
    }
    if (cfg.requiredBanHwidMatches < 0 || cfg.requiredBanHwidMatches > 6) {
        return ctx.send({ type: 'danger', message: 'The Required Ban HWID matches must be between 0 (disabled) and 6.' });
    }

    //Validating custom rejection messages
    if (cfg.whitelistRejectionMessage.length > 512) {
        return ctx.send({ type: 'danger', message: 'The whitelist rejection message must be less than 512 characters.' });
    }
    if (cfg.banRejectionMessage.length > 512) {
        return ctx.send({ type: 'danger', message: 'The ban rejection message must be less than 512 characters.' });
    }

    //Preparing & saving config
    const newConfig = ctx.txAdmin.configVault.getScopedStructure('playerDatabase');
    newConfig.onJoinCheckBan = cfg.onJoinCheckBan;
    newConfig.whitelistMode = cfg.whitelistMode;
    newConfig.whitelistedDiscordRoles = cfg.whitelistedDiscordRoles;
    newConfig.whitelistRejectionMessage = cfg.whitelistRejectionMessage;
    newConfig.requiredBanHwidMatches = cfg.requiredBanHwidMatches;
    newConfig.banRejectionMessage = cfg.banRejectionMessage;
    try {
        ctx.txAdmin.configVault.saveProfile('playerDatabase', newConfig);
    } catch (error) {
        console.warn(`[${ctx.admin.name}] Error changing Player Manager settings.`);
        console.verbose.dir(error);
        return ctx.send({
            type: 'danger',
            markdown: true,
            message: `**Error saving the configuration file:** ${(error as Error).message}`
        });
    }

    //Sending output
    ctx.txAdmin.statsManager.txRuntime.whitelistCheckTime.clear();
    ctx.txAdmin.playerDatabase.refreshConfig();
    ctx.txAdmin.fxRunner.resetConvars();
    ctx.admin.logAction('Changing Player Manager settings.');
    return ctx.send({
        type: 'success',
        markdown: true,
        message: `**Player Manager configuration saved!**`
    });
}


//================================================================
/**
 * Handle Monitor settings
 */
async function handleMonitor(ctx: AuthedCtx) {
    //Sanity check
    if (
        isUndefined(ctx.request.body.restarterSchedule),
        isUndefined(ctx.request.body.resourceStartingTolerance)
    ) {
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    //Prepare body input
    let cfg = {
        restarterSchedule: ctx.request.body.restarterSchedule.split(',').map((x: string) => x.trim()),
        resourceStartingTolerance: parseInt(ctx.request.body.resourceStartingTolerance),
    };

    //Checking if resourceStartingTolerance is valid integer
    if (typeof cfg.resourceStartingTolerance !== 'number' || isNaN(cfg.resourceStartingTolerance)) {
        return ctx.send({ type: 'danger', message: 'resourceStartingTolerance must be a number.' });
    }

    //Validating restart times
    const { valid: validRestartTimes, invalid: invalidRestartTimes } = parseSchedule(cfg.restarterSchedule);
    if (invalidRestartTimes.length) {
        let message = '<strong>The following entries were not recognized as valid 24h times:</strong><br>';
        message += invalidRestartTimes.join('<br>\n');
        return ctx.send({ type: 'danger', message: message });
    }

    //Preparing & saving config
    const newConfig = ctx.txAdmin.configVault.getScopedStructure('monitor');
    newConfig.restarterSchedule = validRestartTimes.map(t => t.string);
    newConfig.resourceStartingTolerance = cfg.resourceStartingTolerance;
    try {
        ctx.txAdmin.configVault.saveProfile('monitor', newConfig);
    } catch (error) {
        console.warn(`[${ctx.admin.name}] Error changing Restarter settings.`);
        console.verbose.dir(error);
        return ctx.send({
            type: 'danger',
            markdown: true,
            message: `**Error saving the configuration file:** ${(error as Error).message}`
        });
    }

    //Sending output
    ctx.txAdmin.healthMonitor.refreshConfig();
    ctx.txAdmin.scheduler.refreshConfig();
    ctx.admin.logAction('Changing monitor settings.');
    return ctx.send({
        type: 'success',
        markdown: true,
        message: `**Restarter configuration saved!**`
    });
}


//================================================================
/**
 * Handle Discord settings
 */
async function handleDiscord(ctx: AuthedCtx) {
    //Sanity check
    if (
        isUndefined(ctx.request.body.enabled)
        || isUndefined(ctx.request.body.token)
        || isUndefined(ctx.request.body.guild)
        || isUndefined(ctx.request.body.announceChannel)
        || isUndefined(ctx.request.body.embedJson)
        || isUndefined(ctx.request.body.embedConfigJson)
    ) {
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    //Handle validate/repair JSONS
    let embedJson, embedConfigJson, whichJson;
    try {
        whichJson = 'Embed JSON';
        embedJson = jsonrepair(ctx.request.body.embedJson.trim());

        whichJson = 'Embed Config JSON';
        embedConfigJson = jsonrepair(ctx.request.body.embedConfigJson.trim());
    } catch (error) {
        return ctx.send({
            type: 'danger',
            markdown: true,
            message: `**Invalid ${whichJson}:**\n${(error as Error).message}`,
        });
    }

    //Validating embed JSONs
    try {
        generateStatusMessage(ctx.txAdmin, embedJson, embedConfigJson);
    } catch (error) {
        return ctx.send({
            type: 'danger',
            markdown: true,
            message: `**Embed validation failed:**\n${(error as Error).message}`,
        });
    }

    //Prepare body input
    const cfg = {
        enabled: (ctx.request.body.enabled === 'true'),
        token: ctx.request.body.token.trim(),
        guild: ctx.request.body.guild.trim(),
        announceChannel: ctx.request.body.announceChannel.trim(),
        embedJson,
        embedConfigJson,
    };

    //Preparing & saving config
    const newConfig = ctx.txAdmin.configVault.getScopedStructure('discordBot');
    newConfig.enabled = cfg.enabled;
    newConfig.token = cfg.token;
    newConfig.guild = (cfg.guild.length) ? cfg.guild : false;
    newConfig.announceChannel = (cfg.announceChannel.length) ? cfg.announceChannel : false;
    newConfig.embedJson = cfg.embedJson;
    newConfig.embedConfigJson = cfg.embedConfigJson;
    try {
        ctx.txAdmin.configVault.saveProfile('discordBot', newConfig);
    } catch (error) {
        console.warn(`[${ctx.admin.name}] Error changing Discord settings.`);
        console.verbose.dir(error);
        return ctx.send({
            type: 'danger',
            markdown: true,
            message: `**Error saving the configuration file:** ${(error as Error).message}`
        });
    }

    //Restarting discord bot
    ctx.admin.logAction('Changing discordBot settings.');
    try {
        await ctx.txAdmin.discordBot.refreshConfig();
    } catch (error) {
        const errorCode = (error as any).code;
        let extraContext = '';
        if (errorCode === 'DisallowedIntents' || errorCode === 4014) {
            extraContext = `**The bot requires the \`GUILD_MEMBERS\` intent.**
            - Go to the Discord Dev Portal (https://discord.com/developers/applications)
            - Navigate to \`Bot > Privileged Gateway Intents\`.
            - Enable the \`GUILD_MEMBERS\` intent.
            - Press save on the developer portal.
            - Go to the \`txAdmin > Settings > Discord Bot\` and press save.`;
        } else if (errorCode === 'CustomNoGuild') {
            const inviteUrl = ('clientId' in (error as any))
                ? `https://discord.com/oauth2/authorize?client_id=${(error as any).clientId}&scope=bot&permissions=0`
                : `https://discordapi.com/permissions.html#0`
            extraContext = `**This usually mean one of the issues below:**
            - **Wrong guild/server ID:** read the description of the guild/server ID setting for more information.
            - **Bot is not in the guild/server:** you need to [INVITE THE BOT](${inviteUrl}) to join the server.
            - **Wrong bot:** you may be using the token of another discord bot.`;
        } else if (errorCode === 'DangerousPermission') {
            extraContext = `You need to remove the permissions listed above to be able to enable this bot.
            This should be done in the Discord Server role configuration page and not in the Dev Portal.
            Check every single role that the bot has in the server.

            Please keep in mind that:
            - These permissions are dangerous because if the bot token leaks, an attacker can cause permanent damage to your server.
            - No bot should have more permissions than strictly needed, especially \`Administrator\`.
            - You should never have multiple bots using the same token, create a new one for each bot.`;
        }
        return ctx.send({
            type: 'danger',
            markdown: true,
            message: `**Error starting the bot:** ${(error as Error).message}\n${extraContext}`.trim()
        });
    }

    //Sending output
    return ctx.send({
        type: 'success',
        markdown: true,
        message: `**Discord configuration saved!**
        If _(and only if)_ the status embed is not being updated, check the System Logs page and make sure there are no embed errors.`
    });
}


//================================================================
/**
 * Handle Menu settings
 * NOTE: scoped inside global settings
 */
async function handleMenu(ctx: AuthedCtx) {
    //Sanity check
    if (
        isUndefined(ctx.request.body.menuEnabled)
        || isUndefined(ctx.request.body.menuAlignRight)
        || isUndefined(ctx.request.body.menuPageKey)
        || isUndefined(ctx.request.body.hideAdminInPunishments)
        || isUndefined(ctx.request.body.hideAdminInMessages)
        || isUndefined(ctx.request.body.hideDefaultAnnouncement)
        || isUndefined(ctx.request.body.hideDefaultDirectMessage)
        || isUndefined(ctx.request.body.hideDefaultWarning)
        || isUndefined(ctx.request.body.hideDefaultScheduledRestartWarning)
    ) {
        return ctx.utils.error(400, 'Invalid Request - missing parameters');
    }

    //Prepare body input
    const cfg = {
        menuEnabled: (ctx.request.body.menuEnabled === 'true'),
        menuAlignRight: (ctx.request.body.menuAlignRight === 'true'),
        menuPageKey: ctx.request.body.menuPageKey.trim(),
        hideAdminInPunishments: (ctx.request.body.hideAdminInPunishments === 'true'),
        hideAdminInMessages: (ctx.request.body.hideAdminInMessages === 'true'),
        hideDefaultAnnouncement: (ctx.request.body.hideDefaultAnnouncement === 'true'),
        hideDefaultDirectMessage: (ctx.request.body.hideDefaultDirectMessage === 'true'),
        hideDefaultWarning: (ctx.request.body.hideDefaultWarning === 'true'),
        hideDefaultScheduledRestartWarning: (ctx.request.body.hideDefaultScheduledRestartWarning === 'true'),
    };

    //Preparing & saving config
    const newConfig = ctx.txAdmin.configVault.getScopedStructure('global');
    newConfig.menuEnabled = cfg.menuEnabled;
    newConfig.menuAlignRight = cfg.menuAlignRight;
    newConfig.menuPageKey = cfg.menuPageKey;
    newConfig.hideAdminInPunishments = cfg.hideAdminInPunishments;
    newConfig.hideAdminInMessages = cfg.hideAdminInMessages;
    newConfig.hideDefaultAnnouncement = cfg.hideDefaultAnnouncement;
    newConfig.hideDefaultDirectMessage = cfg.hideDefaultDirectMessage;
    newConfig.hideDefaultWarning = cfg.hideDefaultWarning;
    newConfig.hideDefaultScheduledRestartWarning = cfg.hideDefaultScheduledRestartWarning;
    try {
        ctx.txAdmin.configVault.saveProfile('global', newConfig);
    } catch (error) {
        console.warn(`[${ctx.admin.name}] Error changing Global settings.`);
        console.verbose.dir(error);
        return ctx.send({
            type: 'danger',
            markdown: true,
            message: `**Error saving the configuration file:** ${(error as Error).message}`
        });
    }

    //Sending output
    ctx.txAdmin.refreshConfig();
    ctx.txAdmin.fxRunner.resetConvars();
    ctx.admin.logAction('Changing menu settings.');
    return ctx.send({
        type: 'success',
        markdown: true,
        message: `**Game configuration saved!**
        You need to restart the server for the changes to take effect.`
    });
}
