const logger = require('../log');

const botMentioned = (message, client) => {
    logger.log(`${message.author.username} mentioned bot`);
    message.reply('Do you need help?').then(async msg => {
        const filter = (reaction, user) => {
            return  user.id === message.author.id;
        };
        await msg.react('👍');
        await msg.react('👎');
        const collector = msg.createReactionCollector(filter, {max: 1, time: 15000});
        collector.on('collect', (reaction, user) => {
            logger.log(`Collected ${reaction.emoji.name} from ${user.tag}`);
            if(reaction.emoji.name === '👍'){
                const help = client.commands.get('help');
                help.execute(message, []);
            }
        });
        collector.on('end', collected => {
            logger.debug('Collector ended');
            msg.delete();
        })
    });
};

module.exports = {
    botMentioned
}