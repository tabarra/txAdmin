const modulename = 'DiscordBot:cmd:whitelist';
import { CommandInteraction as ChatInputCommandInteraction, CommandInteraction, CommandInteractionOptionResolver, ImageURLOptions } from 'discord.js';
import TxAdmin from '@core/txAdmin';
import { now } from '@core/extras/helpers';
import { DuplicateKeyError } from '@core/components/PlayerDatabase';
import { embedder, ensurePermission, logDiscordAdminAction } from '../discordHelpers';
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);


/**
 * Command /whitelist member <mention>
 */
const handleMemberSubcommand = async (interaction: ChatInputCommandInteraction, txAdmin: TxAdmin, adminName: string) => {
    //Preparing player id/name/avatar
    const member = interaction.options.getMember('member');
    if(!member || !('user' in member)){
        return await interaction.reply(embedder.danger(`Failed to resolve member ID.`));
    }
    const identifier = `discord:${member.id}`;
    const playerName = `${member.nickname ?? member.user.username}#${member.user.discriminator}`;
    const avatarOptions: ImageURLOptions = { size: 64, forceStatic: true };
    const playerAvatar = member.displayAvatarURL(avatarOptions) ?? member.user.displayAvatarURL(avatarOptions);

    //Registering approval
    try {
        txAdmin.playerDatabase.registerWhitelistApprovals({
            identifier,
            playerName,
            playerAvatar,
            tsApproved: now(),
            approvedBy: adminName,
        });
        txAdmin.fxRunner.sendEvent('whitelistPreApproval', {
            action: 'added',
            identifier,
            playerName,
            adminName,
        });
    } catch (error) {
        return await interaction.reply(embedder.danger(`Failed to save whitelist approval: ${(error as Error).message}`));
    }

    const msg = `Added whitelist approval for ${playerName}.`;
    logDiscordAdminAction(txAdmin, adminName, msg);
    return await interaction.reply(embedder.success(msg));
}


/**
 * Command /whitelist request <id>
 */
const handleRequestSubcommand = async (interaction: ChatInputCommandInteraction, txAdmin: TxAdmin, adminName: string) => {
    //@ts-ignore: somehow vscode is resolving interaction as CommandInteraction
    const input = interaction.options.getString('id', true);
    const reqId = input.trim().toUpperCase();
    if (reqId.length !== 5 || reqId[0] !== 'R') {
        return await interaction.reply(embedder.danger('Invalid request ID.'));
    }

    //Find request
    const requests = txAdmin.playerDatabase.getWhitelistRequests({ id: reqId });
    if (!requests.length) {
        return await interaction.reply(embedder.warning(`Whitelist request ID \`${reqId}\` not found.`));
    }
    const req = requests[0]; //just getting the first

    //Register whitelistApprovals
    const identifier = `license:${req.license}`;
    const playerName = req.discordTag ?? req.playerDisplayName;
    try {
        txAdmin.playerDatabase.registerWhitelistApprovals({
            identifier,
            playerName,
            playerAvatar: (req.discordAvatar) ? req.discordAvatar : null,
            tsApproved: now(),
            approvedBy: adminName,
        });
        txAdmin.fxRunner.sendEvent('whitelistRequest', {
            action: 'approved',
            playerName,
            requestId: req.id,
            license: req.license,
            adminName,
        });
    } catch (error) {
        if (!(error instanceof DuplicateKeyError)) {
            return await interaction.reply(embedder.danger(`Failed to save wl approval: ${(error as Error).message}`));
        }
    }

    //Remove record from whitelistRequests
    try {
        txAdmin.playerDatabase.removeWhitelistRequests({ id: reqId });
    } catch (error) {
        return await interaction.reply(embedder.danger(`Failed to remove wl request: ${(error as Error).message}`));
    }

    const msg = `Approved whitelist request \`${reqId}\` from ${playerName}.`;
    logDiscordAdminAction(txAdmin, adminName, msg);
    return await interaction.reply(embedder.success(msg));
}


/**
 * Handler for /whitelist
 */
export default async (interaction: ChatInputCommandInteraction, txAdmin: TxAdmin) => {
    //Check permissions
    const adminName = await ensurePermission(interaction, txAdmin, 'players.whitelist');
    if (typeof adminName !== 'string') return;

    //@ts-ignore: somehow vscode is resolving interaction as CommandInteraction
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'member') {
        return await handleMemberSubcommand(interaction, txAdmin, adminName);
    } else if (subcommand === 'request') {
        return await handleRequestSubcommand(interaction, txAdmin, adminName);
    }
    throw new Error(`Subcommand ${subcommand} not found.`);
}
