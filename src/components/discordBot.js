//Requires
const Discord = require('discord.js');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'DiscordBot';


module.exports = class DiscordBot {
    constructor(config) {
        this.config = config;
        if(!this.config.enabled){
            logOk('::Disabled by the config file.', context);
            return;
        }    
        this.client = new Discord.Client({autoReconnect:true});

        this.startBot();
    }


    //================================================================
    async startBot(){
        //Setup event listeners
        this.client.on('ready', () => {
            logOk(`::Started and logged in as '${this.client.user.tag}'`, context);
            this.client.user.setActivity(globals.config.serverName, {type: 'WATCHING'});
            // let chan = this.client.channels.find(u => u.name === 'general');
            // chan.send('Hello, chat!');
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
            process.exit(1);
        }
    }
    

    //================================================================
    async handleMessage(message){
        if(message.author.bot) return;
        if (message.content !== this.config.trigger) return;
        
        //Prepare message's data
        let dataServer = globals.monitor.statusServer; //shorthand much!?
        let color = (dataServer.online)? 0x00FF00 : 0xFF0000;
        let title = (dataServer.online)
            ? `${globals.config.serverName} is currently **Online**!` 
            : `${globals.config.serverName} is currently **Offline**!`;
        let players = (dataServer.online && typeof dataServer.players !== 'undefined')? dataServer.players.length : '--';
        let desc = '';
        desc += `**IP:** ${globals.config.publicIP}:${globals.config.fxServerPort}\n`;
        desc += `**Players:** ${players}\n`;
        
        //Send message
        const embed = new Discord.RichEmbed();
        embed.setTitle(title)
        embed.setColor(color)
        embed.setDescription(desc);
        message.channel.send(embed);
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




} //Fim DiscordBot()
