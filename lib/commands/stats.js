const logger = require('../log')('stats');
const {createStatsEmbed} = require('../discord');
const {getLifeTimeStats, STATS} = require("../pubg");
const {getUserByDiscordId} = require('../db_utils');
module.exports = {
    name: 'stats',
    description: 'Get lifetime stats',
    usage: `[all OR wanted stats (separated with space)] \nAvailable stats are: ${Object.keys(STATS).join(', ')}`,
    requiresAuth: false,
    args: true,
    requiresAPIKey: true,
    argCount: 1,
    aliases: ['s'],
	async execute(message, args) {
        try{
            const { commands } = message.client;
            let currentUser = await getUserByDiscordId(message.author.id);
            if(!currentUser || !currentUser.pubg_id){
                logger.debug(`${message.author.username} does not have PUBG account associated`)
                const commandName = 'pubg-user';
                const prefix = process.env.COMMAND_PREFIX;
                let userCommand = commands.get(commandName);
                let reply = `I don't have a PUBG username for you. Set one using the ${commandName} command:\n`;
                reply += `\`${prefix}${userCommand.name} ${userCommand.usage}\``
                return message.reply(reply)
            }
            let requestedStats = args;
            let uniqueStats = [...new Set(requestedStats)];
            //if they ask for all, it takes presedence
            if(uniqueStats.includes('all')){
                uniqueStats = Object.keys(STATS);
            }
            let validStats = [];
            let invalidStats = [];
            uniqueStats.forEach(s => {
                if(Object.keys(STATS).includes(s)){
                    validStats.push(s);
                }else{
                    invalidStats.push(s);
                }
            });
            if(validStats.length === 0){
                let msg = requestedStats.length > 1 ? 'are not valid stats' : 'is not a valid stat';
                msg += ' (they are case-sensitive 🤷‍♂️)';
                return message.reply(`\`${requestedStats.join(',')}\` ${msg}`);
            }
            logger.info(`Getting stats for ${currentUser.pubg_username}`);
            let playerId = currentUser.pubg_id;
            let stats = await getLifeTimeStats(playerId, validStats);
            if(!stats){
                return message.reply(`\nI couldn't find any stats :grimacing:`);
            }
            let embed = await createStatsEmbed(stats, currentUser.pubg_username);
            
            message.channel.send(embed);
            if(invalidStats.length > 0){
                message.channel.send(`Invalid stats were omitted: \`${invalidStats.join(', ')}\``)
            }
        }catch(e){
            logger.error(e);
            message.reply(`\nCouldn't find any recent wins for **${currentUser.pubg_username}** :shrug:`);
        }
	}
}