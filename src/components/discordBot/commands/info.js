//Requires
const modulename = 'DiscordBot:cmd:info';
const { RichEmbed } = require("discord.js");
const { dir, log, logOk, logWarn, logError } = require('../../../extras/console')(modulename);

//TODO: this doesn't make sense if we are not saving ot the db the player identifiers
module.exports = {
    description: 'Prints info about a player',
    cooldown: 5,
    async execute(message, args) {
        const targetID = (message.mentions.users.size)
            ? message.mentions.users.first().id
            : message.author.id;   
        return message.reply(targetID);
    },
};
