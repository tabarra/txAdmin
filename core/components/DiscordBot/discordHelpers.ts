const modulename = 'DiscordBot:cmd';
import logger from '@core/extras/console.js';
import TxAdmin from "@core/txAdmin";
import { ColorResolvable, CommandInteraction, EmbedBuilder, InteractionReplyOptions } from "discord.js";
const { dir, log, logOk, logWarn, logError } = logger(modulename);


/**
 * Generic embed generation functions
 */
const genericEmbed = (
    msg: string,
    ephemeral = false,
    color: ColorResolvable | null = null,
    emoji?: string
): InteractionReplyOptions => {
    return {
        ephemeral,
        embeds: [new EmbedBuilder({
            description: emoji ? `:${emoji}: ${msg}` : msg,
        }).setColor(color)],
    }
}

export const embedder = {
    generic: genericEmbed,
    success: (msg: string, ephemeral = false) => genericEmbed(msg, ephemeral, '#0BA70B', 'white_check_mark'),
    warning: (msg: string, ephemeral = false) => genericEmbed(msg, ephemeral, '#FFF100', 'warning'),
    danger: (msg: string, ephemeral = false) => genericEmbed(msg, ephemeral, '#A70B28', 'no_entry_sign'),
}


/**
 * Ensure that the discord interaction author has the required permission
 */
export const ensurePermission = async (interaction: CommandInteraction, txAdmin: TxAdmin, reqPerm: string) => {
    const admin = txAdmin.adminVault.getAdminByProviderUID(interaction.user.id);
    if (!admin) {
        await interaction.reply(
            embedder.warning('Your Discord ID is not registered in txAdmin :face_with_monocle:', true)
        );
        return false;
    }
    if (
        admin.master !== true
        && !admin.permissions.includes('all_permissions')
        && !admin.permissions.includes(reqPerm)
    ) {
        //@ts-ignore: not important
        const permName = txAdmin.adminVault.registeredPermissions[reqPerm] ?? 'Unknown';
        await interaction.reply(
            embedder.danger(`You do not have the "${permName}" permissions.`, true)
        );
        return false;
    }

    return admin.name;
}


/**
 * Equivalent to ctx.utils.logAction()
 */
export const logDiscordAdminAction = async (txAdmin: TxAdmin, adminName: string, message: string) => {
    txAdmin.logger.admin.write(adminName, message);
}
