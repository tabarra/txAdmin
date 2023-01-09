const modulename = 'DiscordBot';
import Discord, { Client, Intents } from 'discord.js';
// import { Client, GatewayIntentBits, Partials, EmbedBuilder } from 'discord.js';
import logger, { ogConsole } from '@core/extras/console.js';
import { convars, verbose } from '@core/globalData';
import { now } from '@core/extras/helpers';
import TxAdmin from '@core/txAdmin';
import slashCommands from './slash';
import interactionCreateHandler from './interactionCreateHandler';
// import commands from './commands';
const { dir, log, logOk, logWarn, logError, logDebug } = logger(modulename);

//Helpers
type DiscordBotConfigType = {
    enabled: boolean;
    token: string;
    announceChannel: string;
    statusMessage: string;
}


export default class DiscordBot {
    readonly #txAdmin: TxAdmin;
    readonly #clientOptions: Discord.ClientOptions = {
        intents: new Intents([
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_MEMBERS,
        ]),
        allowedMentions: {
            parse: ['users'],
            repliedUser: true,
        },
        http: {
            agent: {
                localAddress: convars.forceInterface ? convars.forceInterface : undefined,
            }
        }
    }
    readonly usageStats = {
        addwl: 0,
        help: 0,
        status: 0,
        txadmin: 0,
    };
    readonly cooldowns = new Map();
    client: Client | undefined;
    announceChannel: Discord.TextBasedChannel | undefined;


    constructor(txAdmin: TxAdmin, public config: DiscordBotConfigType) {
        this.#txAdmin = txAdmin;

        if (this.config.enabled) {
            this.startBot().catch(() => { });
        }
    }


    /**
     * Refresh discordBot configurations
     */
    async refreshConfig() {
        this.config = this.#txAdmin.configVault.getScoped('discordBot');
        if (this.client) {
            logWarn('Stopping Discord Bot');
            this.client.destroy();
            setTimeout(() => {
                if (!this.config.enabled) this.client = undefined;
            }, 1000);
        }

        if (this.config.enabled) {
            return this.startBot();
        } else {
            return true;
        }
    }


    /**
     * Send an announcement to the configured channel
     * @param {string} message
     */
    async sendAnnouncement(message: string) {
        if (
            !this.config.announceChannel
            || !this.client?.isReady()
            || !this.announceChannel
        ) {
            if (verbose) logWarn('not ready yet', 'sendAnnouncement');
            return false;
        }

        try {
            await this.announceChannel.send(message);
        } catch (error) {
            logError(`Error sending Discord announcement: ${(error as Error).message}`);
        }
    }


    /**
     * Update persistent status and activity
     */
    async updateStatus() {
        if (!this.client?.isReady()) {
            if (verbose) logWarn('not ready yet', 'updateStatus');
            return false;
        }

        try {
            this.client.user.setActivity(globals.config.serverName, { type: 'WATCHING' });
        } catch (error) {
            if (verbose) logWarn('failed to set bot activity', 'updateStatus');
        }

        //TODO: status message
        //generate embed in another file?
        // the /setstatus command just sends message, gets its id, saves to kvp, then calls this function
    }


    /**
     * Starts the discord client
     */
    startBot() {
        return new Promise<void>((resolve, reject) => {
            //State check
            if (this.client?.ws.status !== 3 && this.client?.ws.status !== 5) {
                logWarn('Destroying client before restart.');
                this.client?.destroy();
            }

            //Setting up client object
            this.client = new Client(this.#clientOptions);

            //Setup Ready listener
            this.client.on('ready', async () => {
                if (!this.client?.isReady()) throw new Error(`ready event while not being ready`);
                // logOk(`Started and logged in as '${this.client?.user?.tag}'`);
                this.updateStatus();

                //Saving announcements channel
                const fetchedChannel = this.client.channels.cache.find((x) => x.id === this.config.announceChannel);
                if (!fetchedChannel) {
                    logError(`Channel ${this.config.announceChannel} not found`);
                } else if (!fetchedChannel.isText()) {
                    logError(`Channel ${this.config.announceChannel} - ${fetchedChannel.name} is not a text channel`);
                } else {
                    this.announceChannel = fetchedChannel;
                }

                this.client.application.commands.set(slashCommands);

                return resolve();
            });

            //Setup remaining event listeners
            this.client.on('error', (error) => {
                logError(`Error from Discord.js client: ${error.message}`);
                return reject(error);
            });
            this.client.on('resume', () => {
                if (verbose) logOk('Connection with Discord API server resumed');
                this.updateStatus();
            });
            this.client.on('interactionCreate', interactionCreateHandler.bind(null, this.#txAdmin));
            this.client.on('debug', logDebug);

            //Start bot
            this.client.login(this.config.token).catch((error) => {
                logError(`Discord login failed with error: ${(error as Error).message}`);
                return reject(error);
            });
        });
    }

    // async handleMessage(message: string) {
    //     //Ignoring bots and DMs
    //     if (message.author.bot) return;
    //     if (!message.content.startsWith(this.config.prefix)) return;

    //     //Parse message
    //     const args = message.content.slice(this.config.prefix.length).split(/\s+/);
    //     const commandName = args.shift().toLowerCase();

    //     //Check if its a recognized command
    //     const command = this.commands.get(commandName);
    //     if (!command) return;

    //     //Check spam limiter
    //     if (!this.cooldowns.has(commandName)) {
    //         this.cooldowns.set(commandName, now());
    //     } else {
    //         const cooldownTime = command.cooldown || 30;
    //         const expirationTime = this.cooldowns.get(commandName) + cooldownTime;
    //         const ts = now();
    //         if (ts < expirationTime) {
    //             const timeLeft = expirationTime - ts;
    //             if (verbose) log(`Spam prevented for command "${commandName}".`);
    //             return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${commandName}\` command again.`);
    //         }
    //     }

    //     //Increment usage stats
    //     this.usageStats[commandName] = (typeof this.usageStats[commandName] == 'undefined') ? 1 : this.usageStats[commandName] + 1;

    //     //Executing command
    //     try {
    //         await command.execute(message, args);
    //     } catch (error) {
    //         logError(`Failed to execute ${commandName}: ${error.message}`);
    //     }
    // }


    /**
     * Resolves a user by its discord identifier.
     * NOTE: using announceChannel to find out the guild
     * FIXME: add lru-cache
     */
    async resolveMember(uid: string) {
        if (!this.client?.isReady()) throw new Error(`discord bot not ready yet`);
        const avatarOptions: Discord.StaticImageURLOptions = { size: 64 };

        //Check if in guild member
        if (this.announceChannel?.guild) {
            try {
                const member = await this.announceChannel.guild.members.fetch(uid);
                return {
                    tag: `${member.nickname ?? member.user.username}#${member.user.discriminator}`,
                    avatar: (member ?? member.user).displayAvatarURL(avatarOptions),
                };
            } catch (error) { }
        }

        //Checking if user resolvable
        const user = await this.client.users.fetch(uid);
        if (user) {
            return {
                tag: `${user.username}#${user.discriminator}`,
                avatar: user.displayAvatarURL(avatarOptions),
            };
        } else {
            throw new Error(`could not resolve discord user`);
        }
    }
};
