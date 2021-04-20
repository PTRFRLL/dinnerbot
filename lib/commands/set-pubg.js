const logger = require('../log')('set-pubg-user');
const db = require("../db_utils");
const pubg = require("../pubg");

module.exports = {
    name: 'set-pubg',
    description: 'Sets your PUBG username',
    usage: '[PUBG username]',
    args: true,
    argCount: 1,
    requiresAuth: false,
    requiresAPIKey: true,
    aliases: ['sp'],
	async execute(message, args) {
        let username = args.shift();
        logger.debug(`Passed PUBG username: ${username}`);
        
        let currentUser = await db.getUserByDiscordId(message.author.id);
        if(currentUser && currentUser.pubg_username === username){
            message.reply(`You're username is already set to **${currentUser.pubg_username}**`);
            return;
        }else if(!currentUser?.pubg_username){
            let succeeded = await this.updatePlayer(message.author, username);
            if(!succeeded){
                message.reply(`\n:x: I can't find the PUBG username **${username}**\n(usernames are case-sensitive)`)
                return;
            }else{
                message.reply(`\n:white_check_mark: Your PUBG username has been set to **${username}**`);
            }
        }else{
            message.reply(`You're PUBG username is already set as **${currentUser.pubg_username}**. \nDo you want to replace it?`).then(async msg => {
                const filter = (reaction, user) => {
                    return  user.id === message.author.id;
                };
                await msg.react('👍');
                await msg.react('👎');
                const collector = msg.createReactionCollector(filter, {max: 1, time: 15000});
                collector.on('collect', async(reaction, user) => {
                    logger.info(`Collected ${reaction.emoji.name} from ${user.tag}`);
                    if(reaction.emoji.name === '👍'){
                        let succeeded = await this.updatePlayer(message.author, username);
                        if(!succeeded){
                            message.reply(`\n:x: I can't find the PUBG username **${username}**\n(usernames are case-sensitive)`)
                            return;
                        }else{
                            message.reply(`\n:white_check_mark: Your PUBG username has been set to **${username}**`);
                        }
                    }
                });
                collector.on('end', collected => {
                    logger.debug('Collector ended');
                    msg.delete();
                })
            });
        }
	},
    async updatePlayer(author, username){
        let player = await pubg.getPlayerDetails(username);
        if(!player){
            return false;
        }
        //Set username in DB 
        let updated = await db.updatePlayerUsername(author, username, player.id);
        if(updated.pubg_username === username){
            return true;
        }
    }
}