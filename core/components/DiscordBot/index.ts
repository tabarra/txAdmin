const modulename = 'DiscordBot';
import Discord, { ActivityType, ChannelType, Client, EmbedBuilder, GatewayIntentBits } from 'discord.js';
import TxAdmin from '@core/txAdmin';
import slashCommands from './slash';
import interactionCreateHandler from './interactionCreateHandler';
import { generateStatusMessage } from './commands/status';
import consoleFactory from '@extras/console';
import { embedColors } from './discordHelpers';
const console = consoleFactory(modulename);


//Helpers
type DiscordBotConfigType = {
    enabled: boolean;
    token: string;
    guild: string;
    announceChannel: string;
    embedJson: string;
    embedConfigJson: string;
}

type MessageTranslationType = {
    key: string;
    data?: object;
}

type AnnouncementType = {
    title?: string | MessageTranslationType;
    description: string | MessageTranslationType;
    type: keyof typeof embedColors;
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
            console.warn('Stopping Discord Bot');
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
     */
    async sendAnnouncement(content: AnnouncementType) {
        if (!this.config.enabled) return;
        if (
            !this.config.announceChannel
            || !this.#client?.isReady()
            || !this.announceChannel
        ) {
            console.verbose.warn('not ready yet to send announcement');
            return false;
        }

        try {
            let title;
            if (content.title) {
                title = (typeof content.title === 'string')
                    ? content.title
                    : this.#txAdmin.translator.t(content.title.key, content.title.data);
            }
            let description;
            if (content.description) {
                description = (typeof content.description === 'string')
                    ? content.description
                    : this.#txAdmin.translator.t(content.description.key, content.description.data);
            }

            const embed = new EmbedBuilder({ title, description }).setColor(embedColors[content.type]);
            await this.announceChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error(`Error sending Discord announcement: ${(error as Error).message}`);
        }
    }


    /**
     * Update persistent status and activity
     */
    async updateStatus() {
        if (!this.#client?.isReady() || !this.#client.user) {
            console.verbose.warn('not ready yet to update status');
            return false;
        }

        //Updating bot activity
        try {
            const serverClients = this.#txAdmin.playerlistManager.onlineCount;
            const serverMaxClients = this.#txAdmin.persistentCache.get('fxsRuntime:maxClients') ?? '??';
            const serverName = this.#txAdmin.globalConfig.serverName;
            const message = `[${serverClients}/${serverMaxClients}] on ${serverName}`;
            this.#client.user.setActivity(message, { type: ActivityType.Watching });
        } catch (error) {
            console.verbose.warn(`Failed to set bot activity: ${(error as Error).message}`);
        }

        //Updating server status embed
        try {
            const oldChannelId = this.#txAdmin.persistentCache.get('discord:status:channelId');
            const oldMessageId = this.#txAdmin.persistentCache.get('discord:status:messageId');

            if (typeof oldChannelId === 'string' && typeof oldMessageId === 'string') {
                const oldChannel = await this.#client.channels.fetch(oldChannelId);
                if (!oldChannel) throw new Error(`oldChannel could not be resolved`);
                if (oldChannel.type !== ChannelType.GuildText && oldChannel.type !== ChannelType.GuildAnnouncement) {
                    throw new Error(`oldChannel is not guild text or annoucement channel`);
                }
                await oldChannel.messages.edit(oldMessageId, generateStatusMessage(this.#txAdmin));
            }

        } catch (error) {
            console.verbose.warn(`Failed to update status embed: ${(error as Error).message}`);
        }
    }


    /**
     * Starts the discord client
     */
    startBot() {
        return new Promise<void>((resolve, reject) => {
            type ErrorOptData = {
                code?: string;
                clientId?: string;
                prohibitedPermsInUse?: string[];
            }
            const sendError = (msg: string, data: ErrorOptData = {}) => {
                console.error(msg);
                const e = new Error(msg);
                Object.assign(e, data);
                return reject(e);
            }

            //Check for guild id
            if (typeof this.config.guild !== 'string' || !this.config.guild.length) {
                return sendError('Discord bot enabled while guild id is not set.');
            }

            //State check
            if (this.#client?.ws.status !== 3 && this.#client?.ws.status !== 5) {
                console.verbose.warn('Destroying client before restart.');
                this.#client?.destroy();
            }

            //Setting up client object
            this.#client = new Client(this.#clientOptions);

            //Setup Ready listener
            this.#client.on('ready', async () => {
                if (!this.#client?.isReady() || !this.#client.user) throw new Error(`ready event while not being ready`);

                //Fetching guild
                const guild = this.#client.guilds.cache.find((guild) => guild.id === this.config.guild);
                if (!guild) {
                    return sendError(
                        `Discord bot could not resolve guild/server ID ${this.config.guild}.`,
                        {
                            code: 'CustomNoGuild',
                            clientId: this.#client.user.id
                        }
                    );
                }
                this.guild = guild;
                this.guildName = guild.name;

                //Checking for dangerous permissions
                // https://discord.com/developers/docs/topics/permissions#permissions-bitwise-permission-flags
                // These are the same perms that require 2fa enabled - although it doesn't apply here
                const prohibitedPerms = [
                    'Administrator', //'ADMINISTRATOR',
                    'BanMembers', //'BAN_MEMBERS'
                    'KickMembers', //'KICK_MEMBERS'
                    'ManageChannels', //'MANAGE_CHANNELS',
                    'ManageGuildExpressions', //'MANAGE_GUILD_EXPRESSIONS'
                    'ManageGuild', //'MANAGE_GUILD',
                    'ManageMessages', //'MANAGE_MESSAGES'
                    'ManageRoles', //'MANAGE_ROLES',
                    'ManageThreads', //'MANAGE_THREADS'
                    'ManageWebhooks', //'MANAGE_WEBHOOKS'
                    'ViewCreatorMonetizationAnalytics', //'VIEW_CREATOR_MONETIZATION_ANALYTICS'
                ]
                const botPerms = this.guild.members.me?.permissions.serialize();
                if (!botPerms) {
                    return sendError(`Discord bot could not detect its own permissions.`);
                }
                const prohibitedPermsInUse = Object.entries(botPerms)
                    .filter(([permName, permEnabled]) => prohibitedPerms.includes(permName) && permEnabled)
                    .map((x) => x[0])
                if (prohibitedPermsInUse.length) {
                    const name = this.#client.user.username;
                    const perms = prohibitedPermsInUse.includes('Administrator')
                        ? 'Administrator'
                        : prohibitedPermsInUse.join(', ');
                    return sendError(
                        `This bot (${name}) has dangerous permissions (${perms}) and for your safety the bot has been disabled.`,
                        { code: 'DangerousPermission' }
                    );
                }

                //Fetching announcements channel
                if (this.config.announceChannel) {
                    const fetchedChannel = this.#client.channels.cache.find((x) => x.id === this.config.announceChannel);
                    if (!fetchedChannel) {
                        return sendError(`Channel ${this.config.announceChannel} not found.`);
                    } else if (fetchedChannel.type !== ChannelType.GuildText && fetchedChannel.type !== ChannelType.GuildAnnouncement) {
                        return sendError(`Channel ${this.config.announceChannel} - ${(fetchedChannel as any)?.name} is not a text or annoucement channel.`);
                    } else {
                        this.announceChannel = fetchedChannel;
                    }
                }

                this.guild.commands.set(slashCommands);
                console.ok(`Started and logged in as '${this.#client.user.tag}'`);
                this.updateStatus().catch();

                return resolve();
            });

            //Setup remaining event listeners
            this.#client.on('error', (error) => {
                console.error(`Error from Discord.js client: ${error.message}`);
                return reject(error);
            });
            this.#client.on('resume', () => {
                console.verbose.ok('Connection with Discord API server resumed');
                this.updateStatus().catch();
            });
            this.#client.on('interactionCreate', interactionCreateHandler.bind(null, this.#txAdmin));
            // this.#client.on('debug', console.verbose.debug);

            //Start bot
            this.#client.login(this.config.token).catch((error) => {
                console.error(`Discord login failed with error: ${(error as Error).message}`);
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
            const member = this.guild.members.cache.find(m => m.id === uid) ?? await this.guild.members.fetch(uid);
            return {
                isMember: true,
                memberRoles: member.roles.cache.map((role) => role.id),
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
     */
    async resolveMemberProfile(uid: string) {
        if (!this.#client?.isReady()) throw new Error(`discord bot not ready yet`);
        const avatarOptions: Discord.ImageURLOptions = { size: 64, forceStatic: true };

        //Check if in guild member
        if (this.guild) {
            try {
                const member = this.guild.members.cache.find(m => m.id === uid) ?? await this.guild.members.fetch(uid);
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
