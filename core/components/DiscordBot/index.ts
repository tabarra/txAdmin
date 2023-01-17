const modulename = 'DiscordBot';
import Discord, { ActivityType, ChannelType, Client, GatewayIntentBits } from 'discord.js';
import logger, { ogConsole } from '@core/extras/console.js';
import { verbose } from '@core/globalData';
import TxAdmin from '@core/txAdmin';
import slashCommands from './slash';
import interactionCreateHandler from './interactionCreateHandler';
import { generateStatusMessage } from './commands/status';
const { dir, log, logOk, logWarn, logError, logDebug } = logger(modulename);

//Helpers
type DiscordBotConfigType = {
    enabled: boolean;
    token: string;
    guild: string;
    announceChannel: string;
    embedJson: string;
    embedConfigJson: string;
}


export default class DiscordBot {
    readonly #txAdmin: TxAdmin;
    readonly #clientOptions: Discord.ClientOptions = {
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
        ],
        allowedMentions: {
            parse: ['users'],
            repliedUser: true,
        },
        //FIXME: fixme
        // http: {
        //     agent: {
        //         localAddress: convars.forceInterface ? convars.forceInterface : undefined,
        //     }
        // }
    }
    readonly usageStats = {
        addwl: 0,
        help: 0,
        status: 0,
        txadmin: 0,
    };
    readonly cooldowns = new Map();
    #client: Client | undefined;
    guild: Discord.Guild | undefined;
    guildName: string | undefined;
    announceChannel: Discord.TextBasedChannel | undefined;


    constructor(txAdmin: TxAdmin, public config: DiscordBotConfigType) {
        this.#txAdmin = txAdmin;

        if (this.config.enabled) {
            this.startBot().catch(() => { });
        }

        //Cron
        setInterval(() => {
            if (this.config.enabled) {
                this.updateStatus().catch();
            }
        }, 60_000)
    }


    /**
     * Refresh discordBot configurations
     */
    async refreshConfig() {
        this.config = this.#txAdmin.configVault.getScoped('discordBot');
        if (this.#client) {
            logWarn('Stopping Discord Bot');
            this.#client.destroy();
            setTimeout(() => {
                if (!this.config.enabled) this.#client = undefined;
            }, 1000);
        }

        if (this.config.enabled) {
            return this.startBot();
        } else {
            return true;
        }
    }

    /**
     * Passthrough to discord.js isReady()
     */
    get isClientReady() {
        return (this.#client) ? this.#client.isReady() : false;
    }

    /**
     * Passthrough to discord.js websocket status
     */
    get wsStatus() {
        return (this.#client) ? this.#client.ws.status : false;
    }


    /**
     * Send an announcement to the configured channel
     * @param {string} message
     */
    async sendAnnouncement(message: string) {
        if (!this.config.enabled) return;
        if (
            !this.config.announceChannel
            || !this.#client?.isReady()
            || !this.announceChannel
        ) {
            if (verbose) logWarn('not ready yet to send announcement');
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
        if (!this.#client?.isReady()) {
            if (verbose) logWarn('not ready yet to update status');
            return false;
        }

        //Updating bot activity
        try {
            const serverClients = this.#txAdmin.playerlistManager.onlineCount;
            const serverMaxClients = this.#txAdmin.persistentCache.get('fxsRuntime:maxClients') ?? '??';
            const serverName = this.#txAdmin.globalConfig.serverName;
            const message = `[${serverClients}/${serverMaxClients}] on ${serverName}`;
            this.#client.user.setActivity(message, { type: ActivityType.Playing });
        } catch (error) {
            if (verbose) logWarn(`Failed to set bot activity: ${(error as Error).message}`);
        }

        //Updating server status embed
        try {
            const oldChannelId = this.#txAdmin.persistentCache.get('discord:status:channelId');
            const oldMessageId = this.#txAdmin.persistentCache.get('discord:status:messageId');

            if (typeof oldChannelId === 'string' && typeof oldMessageId === 'string') {
                const oldChannel = await this.#client.channels.fetch(oldChannelId);
                if (!oldChannel) throw new Error(`oldChannel could not be resolved`);
                if (oldChannel.type !== ChannelType.GuildText) throw new Error(`oldChannel is not guild text channel`);
                await oldChannel.messages.edit(oldMessageId, generateStatusMessage(this.#txAdmin));
            }

        } catch (error) {
            if (verbose) logWarn(`Failed to update status embed: ${(error as Error).message}`);
        }
    }


    /**
     * Starts the discord client
     */
    startBot() {
        return new Promise<void>((resolve, reject) => {
            const sendError = (msg: string) => {
                logError(msg);
                return reject(new Error(msg));
            }

            //Check for guild id
            if (typeof this.config.guild !== 'string' || !this.config.guild.length) {
                return sendError('Discord bot enabled while guild id is not set.');
            }

            //State check
            if (this.#client?.ws.status !== 3 && this.#client?.ws.status !== 5) {
                logWarn('Destroying client before restart.');
                this.#client?.destroy();
            }

            //Setting up client object
            this.#client = new Client(this.#clientOptions);

            //Setup Ready listener
            this.#client.on('ready', async () => {
                if (!this.#client?.isReady()) throw new Error(`ready event while not being ready`);

                //Fetching guild
                const guild = this.#client.guilds.cache.find((guild) => guild.id === this.config.guild);
                if (!guild) {
                    return sendError(`Discord bot could not resolve guild id ${this.config.guild}`);
                }
                this.guild = guild;
                this.guildName = guild.name;

                //Fetching announcements channel
                if (this.config.announceChannel) {
                    const fetchedChannel = this.#client.channels.cache.find((x) => x.id === this.config.announceChannel);
                    if (!fetchedChannel) {
                        return sendError(`Channel ${this.config.announceChannel} not found.`);
                    } else if (fetchedChannel.type !== ChannelType.GuildText) {
                        return sendError(`Channel ${this.config.announceChannel} - ${(fetchedChannel as any)?.name} is not a text channel.`);
                    } else {
                        this.announceChannel = fetchedChannel;
                    }
                }

                this.#client.application.commands.set(slashCommands);
                logOk(`Started and logged in as '${this.#client.user.tag}'`);
                this.updateStatus().catch();

                return resolve();
            });

            //Setup remaining event listeners
            this.#client.on('error', (error) => {
                logError(`Error from Discord.js client: ${error.message}`);
                return reject(error);
            });
            this.#client.on('resume', () => {
                if (verbose) logOk('Connection with Discord API server resumed');
                this.updateStatus().catch();
            });
            this.#client.on('interactionCreate', interactionCreateHandler.bind(null, this.#txAdmin));
            //@ts-ignore
            this.#client.on('debug', logDebug);

            //Start bot
            this.#client.login(this.config.token).catch((error) => {
                logError(`Discord login failed with error: ${(error as Error).message}`);
                return reject(error);
            });
        });
    }


    /**
     * Return if an ID is a guild member, and their roles
     */
    async resolveMemberRoles(uid: string) {
        if (!this.config.enabled) throw new Error(`discord bot is disabled`);
        if (!this.#client?.isReady()) throw new Error(`discord bot not ready yet`);
        if (!this.guild) throw new Error(`guild not resolved`);

        try {
            const member = await this.guild.members.fetch(uid);
            return {
                isMember: true,
                memberRoles: member.roles.cache.map((role) => role.id)
            };
        } catch (error) {
            //https://discord.com/developers/docs/topics/opcodes-and-status-codes
            if ((error as any).code === 10007) {
                return { isMember: false }
            } else {
                throw error;
            }
        }
    }


    /**
     * Resolves a user by its discord identifier.
     * FIXME: add lru-cache
     */
    async resolveMemberProfile(uid: string) {
        if (!this.#client?.isReady()) throw new Error(`discord bot not ready yet`);
        const avatarOptions: Discord.ImageURLOptions = { size: 64, forceStatic: true };

        //Check if in guild member
        if (this.guild) {
            try {
                const member = await this.guild.members.fetch(uid);
                return {
                    tag: `${member.nickname ?? member.user.username}#${member.user.discriminator}`,
                    avatar: member.displayAvatarURL(avatarOptions) ?? member.user.displayAvatarURL(avatarOptions),
                };
            } catch (error) { }
        }

        //Checking if user resolvable
        const user = await this.#client.users.fetch(uid);
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
