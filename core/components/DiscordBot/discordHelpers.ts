const modulename = 'DiscordBot:cmd';
import logger from '@core/extras/console.js';
import TxAdmin from "@core/txAdmin";
import orderedEmojis from 'unicode-emoji-json/data-ordered-emoji';
import { ColorResolvable, CommandInteraction, EmbedBuilder, InteractionReplyOptions } from "discord.js";
const { dir, log, logOk, logWarn, logError } = logger(modulename);
const allEmojis = new Set(orderedEmojis);



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
            embedder.warning(`**Your account does not have txAdmin access.** :face_with_monocle:\nIf you are already registered in txAdmin, visit the Admin Manager page, and make sure the Discord ID for your user is set to \`${interaction.user.id}\`.`, true)
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
            embedder.danger(`Your txAdmin account does not have the "${permName}" permissions required for this action.`, true)
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


/**
 * Tests if an embed url is valid or not
 * 
 */
export const isValidEmbedUrl = (url: unknown) => {
    return typeof url === 'string' && /^(https?|discord):\/\//.test(url);
}


/**
 * Tests if an emoji STRING is valid or not.
 * Acceptable options:
 * - UTF-8 emoji ('😄')
 * - Valid emoji ID ('1062339910654246964')
 * - Discord custom emoji (`<:name:id>` or `<a:name:id>`)
 */
export const isValidButtonEmoji = (emoji: unknown) => {
    if (typeof emoji !== 'string') return false;
    if (/^\d{17,19}$/.test(emoji)) return true;
    if (/^<a?:\w{2,32}:\d{17,19}>$/.test(emoji)) return true;
    return allEmojis.has(emoji);
}


//Works
// ogConsole.dir(isValidEmoji('<:txicon:1062339910654246964>'))
// ogConsole.dir(isValidEmoji('1062339910654246964'))
// ogConsole.dir(isValidEmoji('😄'))
// ogConsole.dir(isValidEmoji('🇵🇼'))
// ogConsole.dir(isValidEmoji('\u{1F469}\u{200D}\u{2764}\u{FE0F}\u{200D}\u{1F48B}\u{200D}\u{1F469}'))

//Discord throws api error
// ogConsole.dir(isValidEmoji(':smile:'))
// ogConsole.dir(isValidEmoji('smile'))
// ogConsole.dir(isValidEmoji({name: 'smile'}))
