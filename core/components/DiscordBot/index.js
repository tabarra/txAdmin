const modulename = 'DiscordBot';
import Discord from '@citizenfx/discord.js'
import logger from '@core/extras/console.js';
import { verbose } from '@core/globalData.js';
import commands from './commands';
const { dir, log, logOk, logWarn, logError, logDebug } = logger(modulename);


//Helpers
const now = () => { return Math.round(Date.now() / 1000); };

export default class DiscordBot {
    constructor(config) {
        this.config = config;
        this.client = null;
        this.announceChannel = null;
        this.usageStats = {
            addwl: 0,
            help: 0,
            status: 0,
            txadmin: 0,
        };

        //NOTE: setting them up statically due to bundler requirements
        this.commands = new Map([
            ['addwl', commands.addwl],
            ['help', commands.help],
            ['status', commands.status],
            ['txadmin', commands.txadmin],

            //FIXME: first we need to have player ids in the players db
            // ['info', commands.info],
        ]);
        this.cooldowns = new Map();

        if (!this.config.enabled) {
            // logOk('Disabled by the config file.');
        } else {
            this.startBot();
        }
    }


    //================================================================
    /**
     * Refresh discordBot configurations
     */
    refreshConfig() {
        this.config = globals.configVault.getScoped('discordBot');
        if (this.client !== null) {
            logWarn('Stopping Discord Bot');
            this.client.destroy();
            setTimeout(() => {
                if (this.config.enabled == false) this.client = null;
            }, 1000);
        }
        if (this.config.enabled) {
            this.startBot();
        }
    }//Final refreshConfig()


    //================================================================
    /**
     * Send an announcement to the configured channel
     * @param {string} message
     */
    async sendAnnouncement(message) {
        if (
            !this.config.announceChannel
            || !this.client
            || this.client.status
            || !this.announceChannel
        ) {
            if (verbose) logWarn('returning false, not ready yet', 'sendAnnouncement');
            return false;
        }

        try {
            await this.announceChannel.send(message);
        } catch (error) {
            logError(`Error sending Discord announcement: ${error.message}`);
        }
    }//Final sendAnnouncement()


    //================================================================
    /**
     * Starts the discord client
     */
    async startBot() {
        //State check
        if (this.client !== null && this.client.status !== 5) {
            logWarn('Client not yet destroyed, awaiting destruction.');
            await this.client.destroy();
        }

        //Setup client
        this.client = new Discord.Client({
            intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES],
            autoReconnect: true,
        });

        //Setup Ready listener
        this.client.on('ready', async () => {
            logOk(`Started and logged in as '${this.client.user.tag}'`);
            this.client.user.setActivity(globals.config.serverName, { type: 'WATCHING' });
            this.announceChannel = this.client.channels.cache.find((x) => x.id === this.config.announceChannel);
        });

        //Setup remaining event listeners
        this.client.on('messageCreate', this.handleMessage.bind(this));
        this.client.on('error', (error) => {
            logError(`Error from Discord.js client: ${error.message}`);
        });
        this.client.on('resume', () => {
            if (verbose) logOk('Connection with Discord API server resumed');
            this.client.user.setActivity(globals.config.serverName, { type: 'WATCHING' });
        });
        this.client.on('debug', logDebug);

        //Start bot
        try {
            await this.client.login(this.config.token);
        } catch (error) {
            logError(`Discord login failed with error: ${error.message}`);
            //TODO: colocar aqui mensagem de erro pra aparecer no dashboard
        }
    }

    //================================================================
    async handleMessage(message) {
        //Ignoring bots and DMs
        if (message.author.bot) return;
        if (!message.content.startsWith(this.config.prefix)) return;

        //Parse message
        const args = message.content.slice(this.config.prefix.length).split(/\s+/);
        const commandName = args.shift().toLowerCase();

        //Check if its a recognized command
        const command = this.commands.get(commandName);
        if (!command) return;

        //Check spam limiter
        if (!this.cooldowns.has(commandName)) {
            this.cooldowns.set(commandName, now());
        } else {
            const cooldownTime = command.cooldown || 30;
            const expirationTime = this.cooldowns.get(commandName) + cooldownTime;
            const ts = now();
            if (ts < expirationTime) {
                const timeLeft = expirationTime - ts;
                if (verbose) log(`Spam prevented for command "${commandName}".`);
                return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${commandName}\` command again.`);
            }
        }

        //Increment usage stats
        this.usageStats[commandName] = (typeof this.usageStats[commandName] == 'undefined') ? 1 : this.usageStats[commandName] + 1;

        //Executing command
        try {
            await command.execute(message, args);
        } catch (error) {
            logError(`Failed to execute ${commandName}: ${error.message}`);
        }
    }


    //================================================================
    /**
     * DEBUG: fetch user data
     * @param {string} uid
     */
    // async testFetchUser(uid){
    //     let testUser = await this.client.fetchUser('272800190639898628');
    //     dir(testUser)
    //     dir(testUser.avatarURL)
    // }
};
