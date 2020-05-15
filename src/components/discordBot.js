//Requires
const modulename = 'DiscordBot';
const Discord = require('discord.js');
const humanizeDuration = require('humanize-duration');
const { dir, log, logOk, logWarn, logError } = require('../extras/console')(modulename);


module.exports = class DiscordBot {
    constructor(config) {
        this.config = config;
        this.client = null;
        this.cronFunc = null;
        this.spamLimitCache = {}
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
        clearInterval(this.cronFunc);
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
     * Send an announcement to the configured channel
     * @param {string} message
     */
    sendAnnouncement(message){
        if(
            !this.config.announceChannel ||
            !this.client ||
            this.client.status
        ){
            return false;
        }

        try {
            let chan = this.client.channels.find(x => x.id === this.config.announceChannel);
            if(chan === null){
                logError(`The announcements channel could not be found. Check the ID: ${this.config.announceChannel}`);
                return;
            }

            chan.send(message);
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

        //Setup event listeners
        this.client.on('ready', () => {
            logOk(`Started and logged in as '${this.client.user.tag}'`);
            this.client.user.setActivity(globals.config.serverName, {type: 'WATCHING'});
        });
        this.client.on('message', this.handleMessage.bind(this));
        this.client.on('error', (error) => {
            logError(error.message);
        });
        this.client.on('resume', (error) => {
            if(GlobalData.verbose) logOk('Connection with Discord API server resumed');
        });

        //Start bot
        try {
            await this.client.login(this.config.token);
        } catch (error) {
            logError(error.message);
            //FIXME: colocar aqui mensagem de erro pra aparecer no dashboard
        }
    }


    //================================================================
    async handleMessage(message){
        if(message.author.bot) return;
        let out = false;

        //Checking if message is a command
        if(message.content.startsWith(this.config.statusCommand)){
            //Check spam limiter
            if(!this.spamLimitChecker(this.config.statusCommand, message.channel.id)){
                if(GlobalData.verbose) log(`Spam prevented for command "${this.config.statusCommand}" in channel "${message.channel.name}".`);
                return;
            }
            this.spamLimitRegister(this.config.statusCommand, message.channel.id);

            //Prepare message's RichEmbed + template variables
            let replaces = {};
            let cardColor, cardTitle;
            if(globals.monitor.currentStatus == 'ONLINE' || globals.monitor.currentStatus == 'PARTIAL'){
                cardColor = 0x74EE15;
                cardTitle = globals.translator.t('discord.status_online', {servername: globals.config.serverName});
                replaces.players = (Array.isArray(globals.playerController.activePlayers))? globals.playerController.activePlayers.length : '--';
                replaces.port = (globals.config.forceFXServerPort)? globals.config.forceFXServerPort : globals.fxRunner.fxServerPort;
            }else{
                cardColor = 0xF000FF;
                cardTitle = globals.translator.t('discord.status_offline', {servername: globals.config.serverName});
                replaces.players = '--';
                replaces.port = '--';
            }
            let humanizeOptions = {
                language: globals.translator.t('$meta.humanizer_language'),
                round: true,
                units: ['d', 'h', 'm', 's'],
                fallbacks: ['en']
            }
            replaces.uptime = humanizeDuration(globals.fxRunner.getUptime()*1000, humanizeOptions);
            
            //Replacing text
            let desc = this.config.statusMessage;
            Object.entries(replaces).forEach(([key, value]) => {
                desc = desc.replace(`<${key}>`, value);
            });

            //Prepare object
            out = new Discord.RichEmbed();
            out.setTitle(cardTitle);
            out.setColor(cardColor);
            out.setDescription(desc);

        }else if(message.content.startsWith('/txadmin')){
            //Prepare object
            out = new Discord.RichEmbed();
            out.setTitle(`${globals.config.serverName} uses txAdmin v${GlobalData.txAdminVersion}!`);
            out.setColor(0x4DEEEA);
            out.setDescription(`Checkout the project:\n GitHub: https://github.com/tabarra/txAdmin\n Discord: https://discord.gg/f3TsfvD`);
        }

        //If its not a recognized command
        if(!out) return;

        //Sending message
        try {
            let outMsg = await message.channel.send(out);
            //Example: if you want to delete the messages after a few seconds.
            // setTimeout(() => {
            //     outMsg.delete()
            //     message.delete()
            // }, 10*1000);
        } catch (error) {
            logError(`Failed to send message with error: ${error.message}`);
        }
    }


    //================================================================
    /**
     * Checks the spamLimitCache and returns false if its still in cooldown
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
