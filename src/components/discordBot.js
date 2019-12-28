//Requires
const fs = require('fs-extra');
const Discord = require('discord.js');
const humanizeDuration = require('humanize-duration');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'DiscordBot';


module.exports = class DiscordBot {
    constructor(config) {
        this.config = config;
        this.client = null;
        this.cronFunc = null;
        this.messages = [];
        this.spamLimitCache = {}
        if(!this.config.enabled){
            logOk('::Disabled by the config file.', context);
        }else{
            this.refreshStaticCommands();
            this.cronFunc = setInterval(() => {
                this.refreshStaticCommands();
            }, this.config.refreshInterval);
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
            logWarn(`Stopping Discord Bot`, context);
            this.client.destroy();
            this.client = null;
        }
        if(this.config.enabled){
            this.startBot();
            this.cronFunc = setInterval(() => {
                this.refreshStaticCommands();
            }, this.config.refreshInterval);
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
                logError(`The announcements channel could not be found. Check the ID: ${this.config.announceChannel}`, context);
                return;
            }

            chan.send(message);
        } catch (error) {
            logError(`Error sending Discord announcement: ${error.message}`, context);
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
            logOk(`::Started and logged in as '${this.client.user.tag}'`, context);
            this.client.user.setActivity(globals.config.serverName, {type: 'WATCHING'});
        });
        this.client.on('message', this.handleMessage.bind(this));
        this.client.on('error', (error) => {
            logError(error.message, context);
        });
        this.client.on('resume', (error) => {
            logOk('Connection resumed', context);
        });

        //Start bot
        try {
            await this.client.login(this.config.token);
        } catch (error) {
            logError(error.message, context);
            //FIXME: colocar aqui mensagem de erro pra aparecer no dashboard
        }
    }


    //================================================================
    async handleMessage(message){
        if(message.author.bot) return;
        let out = '';

        //Checking if message is a command
        if(message.content.startsWith(this.config.statusCommand)){
            //Check spam limiter
            if(!this.spamLimitChecker(this.config.statusCommand, message.channel.id)){
                if(globals.config.verbose) log(`Spam prevented for command "${this.config.statusCommand}" in channel "${message.channel.name}".`, context);
                return;
            }
            this.spamLimitRegister(this.config.statusCommand, message.channel.id);

            //Prepare message's data
            let dataServer = globals.monitor.statusServer; //shorthand much!?
            let color = (dataServer.online)? 0x74EE15 : 0xF000FF;
            let titleKey = (dataServer.online)?  'discord.status_online' : 'discord.status_offline';
            let title = globals.translator.t(titleKey, {servername: globals.config.serverName});
            let players = (dataServer.online && typeof dataServer.players !== 'undefined')? dataServer.players.length : '--';
            let desc = '';
            if(globals.config.forceFXServerPort || globals.fxRunner.fxServerPort){
                let port = (globals.config.forceFXServerPort)? globals.config.forceFXServerPort : globals.fxRunner.fxServerPort;
                desc += `**IP:** ${globals.config.publicIP}:${port}\n`;
                desc += `**Players:** ${players}\n`;
            }
            let elapsed = Math.round(Date.now()/1000) - globals.fxRunner.tsChildStarted; //seconds
            let humanizeOptions = {
                language: globals.translator.t('$meta.humanizer_language'),
                round: true,
                units: ['d', 'h', 'm', 's'],
                fallbacks: ['en']
            }
            let uptime = humanizeDuration(elapsed*1000, humanizeOptions);
            desc += `**Uptime:** ${uptime} \n`;

            //Prepare object
            out = new Discord.RichEmbed();
            out.setTitle(title);
            out.setColor(color);
            out.setDescription(desc);

        }else if(message.content.startsWith('/txadmin')){
            //Prepare object
            out = new Discord.RichEmbed();
            out.setTitle(`${globals.config.serverName} uses txAdmin v${globals.version.current}!`);
            out.setColor(0x4DEEEA);
            out.setDescription(`Checkout the project:\n GitHub: https://github.com/tabarra/txAdmin\n Discord: https://discord.gg/f3TsfvD`);

        }else{
            //Finds the command
            let cmd = this.messages.find((staticMessage) => {return message.content.startsWith(staticMessage.trigger)});
            if(!cmd) return;

            //Check spam limiter
            if(!this.spamLimitChecker(cmd.trigger, message.channel.id)){
                if(globals.config.verbose) log(`Spam prevented for command "${cmd.trigger}" in channel "${message.channel.name}".`, context);
                return;
            }
            this.spamLimitRegister(cmd.trigger, message.channel.id);

            //Sets static message
            out = cmd.message;

        }

        //Sending message
        try {
            let outMsg = await message.channel.send(out);
            //Example: if you want to delete the messages after a few seconds.
            // setTimeout(() => {
            //     outMsg.delete()
            //     message.delete()
            // }, 10*1000);
        } catch (error) {
            logError(`Failed to send message with error: ${error.message}`, context);
        }
        /*
            message.content
            message.author.username
            message.author.id
            message.guild.name //servername
            message.channel.name

            message.reply('pong'); //<<reply directly to the user mentioning him
            message.channel.send('Pong.');
        */
    }


    //================================================================
    async refreshStaticCommands(){
        let raw = null;
        let jsonData = null;

        try {
            raw = await fs.readFile(this.config.messagesFilePath, 'utf8');
        } catch (error) {
            logError('Unable to load discord messages. (cannot read file, please read the documentation)', context);
            logError(error.message, context);
            this.messages = [];
            return;
        }

        try {
            jsonData = JSON.parse(raw);
        } catch (error) {
            logError('Unable to load discord messages. (json parse error, please read the documentation)', context);
            this.messages = [];
            return;
        }

        if(!Array.isArray(jsonData)){
            logError('Unable to load discord messages. (not an array, please read the documentation)', context);
            this.messages = [];
            return;
        }

        let structureIntegrityTest = jsonData.some((x) =>{
            if(typeof x.trigger === 'undefined' || typeof x.trigger !== 'string') return true;
            if(typeof x.message === 'undefined' || typeof x.message !== 'string') return true;
            return false;
        });
        if(structureIntegrityTest){
            logError('Unable to load discord messages. (invalid data in the messages file, please read the documentation)', context);
            this.messages = [];
            return;
        }

        this.messages = jsonData;
        if(globals.config.verbose) log(`Discord messages file loaded. Found: ${this.messages.length}`, context);
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
     * TEST: fetch user data
     * @param {string} uid
     */
    // async testFetchUser(uid){
    //     let testUser = await this.client.fetchUser('272800190639898628');
    //     dir(testUser)
    //     dir(testUser.avatarURL)
    // }

} //Fim DiscordBot()
