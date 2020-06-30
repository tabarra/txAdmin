//Requires
const modulename = 'DiscordBot';
const Discord = require('discord.js');

//FIXME: remove when updating to djs12, as well as this from the package.json
const Collection = require('@discordjs/collection'); 

const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);

//NOTE: fix for the fact that fxserver (as of 2627) does not have URLSearchParams as part of the global scope
if(typeof URLSearchParams === 'undefined'){
    global.URLSearchParams = require('url').URLSearchParams;
}


module.exports = class DiscordBot {
    constructor(config) {
        this.config = config;
        this.client = null;
        this.announceChannel = null;
        this.commands = null;
        this.setupCommands();
        
        if(!this.config.enabled){
            logOk('Disabled by the config file.');
        }else{
            this.startBot();
        }
    }


    //================================================================
    /**
     * Refresh discordBot configurations
     */
    refreshConfig(){
        this.config = globals.configVault.getScoped('discordBot');
        if(this.client !== null){
            logWarn(`Stopping Discord Bot`);
            this.client.destroy();
            this.client = null;
        }
        if(this.config.enabled){
            this.startBot();
        }
    }//Final refreshConfig()


    //================================================================
    /**
     * Setup all commands
     * NOTE: setting them up statically due to webpack requirements
     */
    setupCommands(){
        this.commands = new Collection([
            ['addwl', require('./commands/addwl.js')],
            ['help', require('./commands/help.js')],
            ['status', require('./commands/status.js')],
            ['txadmin', require('./commands/txadmin.js')],

            //FIXME: first we need to have player ids in the players db
            // ['info', require('./commands/info.js')], 
        ]);
    }


    //================================================================
    /**
     * Send an announcement to the configured channel
     * @param {string} message
     */
    async sendAnnouncement(message){
        if(
            !this.config.announceChannel ||
            !this.client ||
            this.client.status ||
            !this.announceChannel
        ){
            if(GlobalData.verbose) logWarn(`returning false, not ready yet`, 'sendAnnouncement');
            return false;
        }

        try {
            this.announceChannel.send(message);
        } catch (error) {
            logError(`Error sending Discord announcement: ${error.message}`);
        }
    }//Final sendAnnouncement()


    //================================================================
    /**
     * Starts the discord client
     */
    async startBot(){
        //Setup client
        this.client = new Discord.Client({autoReconnect:true});

        //Setup Ready listener
        this.client.on('ready', async () => {
            logOk(`Started and logged in as '${this.client.user.tag}'`);
            this.client.user.setActivity(globals.config.serverName, {type: 'WATCHING'});
            // this.announceChannel = await this.client.channels.resolve(this.config.announceChannel);
            this.announceChannel = this.client.channels.find(x => x.id === this.config.announceChannel);
            if(!this.announceChannel){
                logError(`The announcements channel could not be found. Check the ID: ${this.config.announceChannel}`);
            }else{
                let cmdDescs = [];
                this.commands.forEach((cmd, name) => {
                    cmdDescs.push(`${this.config.prefix}${name}: ${cmd.description}`);
                });
                const descLines = [
                    `:rocket: **txAdmin** v${GlobalData.txAdminVersion} bot started!`,
                    `:game_die: **Commands:**`,
                    '```',
                    ...cmdDescs,
                    '...more commands to come soon 😮',
                    '```',
                ];
                const msg = new Discord.RichEmbed({
                    color: 0x4287F5,
                    description: descLines.join('\n')
                });
                this.announceChannel.send(msg);
            }
        });

        //Setup remaining event listeners
        this.client.on('message', this.handleMessage.bind(this));
        this.client.on('error', (error) => {
            logError(`Error from Discord.js client: ${error.message}`);
        });
        this.client.on('resume', (error) => {
            if(GlobalData.verbose) logOk('Connection with Discord API server resumed');
            this.client.user.setActivity(globals.config.serverName, {type: 'WATCHING'});
        });

        //Start bot
        try {
            await this.client.login(this.config.token);
        } catch (error) {
            logError(`Discord login failed with error: ${error.message}`);
            //TODO: colocar aqui mensagem de erro pra aparecer no dashboard
        }
    }

    //================================================================
    async handleMessage(message){
        //Ignoring bots and DMs
        if(message.author.bot) return;
        if(message.channel.type !== 'text') return;

        //Parse message
        const args = message.content.slice(this.config.prefix.length).split(/\s+/);
        const commandName = args.shift().toLowerCase();

        //Check if its a recognized command
        const command = this.commands.get(commandName) 
                        || this.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        if (!command) return;

        //TODO: Check spam limiter
        // if(!this.spamLimitChecker(this.config.statusCommand, message.channel.id)){
        //     if(GlobalData.verbose) log(`Spam prevented for command "${this.config.statusCommand}" in channel "${message.channel.name}".`);
        //     return;
        // }
        // this.spamLimitRegister(this.config.statusCommand, message.channel.id);

        // TODO: Save usage
        // this.addUsageStats(commandName);

        //Executing command
        try {
            let sentMsg = await command.execute(message, args);
        } catch (error) {
            logError(`Failed to execute ${commandName}: ${error.message}`);
        }
    }


    //================================================================
    /**
     * Checks the spamLimitCache and returns false if its still in cooldown
     * FIXME:
     * @param {string} cmd
     * @param {string} chan
     */
    spamLimitChecker(cmd, chan){
        let tag = `${chan}:${cmd}`;
        let now = (Date.now() / 1000).toFixed();
        return (typeof this.spamLimitCache[tag] === 'undefined' || (now - this.spamLimitCache[tag] > this.config.commandCooldown))
    }//Final spamLimitChecker()


    //================================================================
    /**
     * Registers a command execution in the spamLimitCache
     * FIXME:
     * @param {string} cmd
     * @param {string} chan
     */
    spamLimitRegister(cmd, chan){
        this.spamLimitCache[`${chan}:${cmd}`] = (Date.now() / 1000).toFixed();
    }//Final spamLimitRegister()


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

} //Fim DiscordBot()
