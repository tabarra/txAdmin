const modulename = 'DiscordBot:cmd:info';
import logger from '@core/extras/console.js';
const { dir, log, logOk, logWarn, logError } = logger(modulename);

//TODO: this doesn't make sense if we are not saving ot the db the player identifiers
export default {
    description: 'Prints info about a player',
    cooldown: 5,
    async execute(message, args) {
        const targetID = (message.mentions.users.size)
            ? message.mentions.users.first().id
            : message.author.id;
        return message.reply(targetID);
    },
};
