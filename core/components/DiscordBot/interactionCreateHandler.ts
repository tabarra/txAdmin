const modulename = 'DiscordBot:interactionHandler';
import { Interaction, InteractionType } from 'discord.js';
import TxAdmin from '@core/txAdmin.js';
import infoCommandHandler from './commands/info';
import statusCommandHandler from './commands/status';
import whitelistCommandHandler from './commands/whitelist';
import { embedder } from './discordHelpers';
import { cloneDeep } from 'lodash-es'; //DEBUG
import consoleFactory from '@extras/console';
const console = consoleFactory(modulename);


//All commands
const handlers = {
    status: statusCommandHandler,
    whitelist: whitelistCommandHandler,
    info: infoCommandHandler,
}

const noHandlerResponse = async (interaction: Interaction) => {
    if (interaction.isRepliable()) {
        //@ts-ignore
        const identifier = interaction?.commandName ?? interaction?.customId ?? 'unknown';
        await interaction.reply({
            content: `No handler available for this interaction (${InteractionType[interaction.type]} > ${identifier})`,
            ephemeral: true,
        });
    }
}


export default async (txAdmin: TxAdmin, interaction: Interaction) => {
    //DEBUG
    // const copy = Object.assign(cloneDeep(interaction), { user: false, member: false });
    // console.dir(copy);
    // return;

    //Handler filter
    if (interaction.user.bot) return;

    //Process buttons
    if (interaction.isButton()) {
        // //Get interaction
        // const [iid, ...args] = interaction.customId.split(':');
        // const handler = txChungus.interactionsManager.cache.get(`button:${iid}`);
        // if (!handler) {
        //     console.error(`No handler available for button interaction ${interaction.customId}`);
        //     return;
        // }
        // txAdmin.statsManager.txRuntime.botCommands.count(???);
        // //Executes interaction
        // try {
        //     return await handler.execute(interaction, args, txChungus);
        // } catch (error) {
        //     return await console.error(`Error executing ${interaction.customId}: ${error.message}`);
        // }
    }

    //Process Slash commands
    if (interaction.isChatInputCommand()) {
        //Get interaction
        const handler = handlers[interaction.commandName as keyof typeof handlers];
        if (!handler) {
            noHandlerResponse(interaction).catch((e) => {});
            return;
        }
        txAdmin.statsManager.txRuntime.botCommands.count(interaction.commandName);

        //Executes interaction
        try {
            await handler(interaction, txAdmin);
            return;
        } catch (error) {
            const msg = `Error executing ${interaction.commandName}: ${(error as Error).message}`;
            console.error(msg);
            await interaction.reply(embedder.danger(msg, true));
            return ;
        }
    }

    //Unknown type
    noHandlerResponse(interaction).catch((e) => {});
};
