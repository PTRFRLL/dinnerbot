const logger = require('../log')('adjust');
const {getMessageUsers, sendWins} = require('../discord');
const {adjustUserWins} = require('../db_utils');

module.exports = {
    name: 'adjust',
    description: 'Manually adjust user wins',
    usage: '@username [number to adjust by]',
    args: true,
    argCount: 2,
    requiresAuth: true,
    aliases: ['a'],
	async execute(message, args) {
        //filter any mentions
        let mentionRegex = /<@!([0-9>]+)>/g;
        let filtered = args.filter(arg => {
            return !arg.match(mentionRegex);
        })
    
        const users = await getMessageUsers(message, false);
        if(users.length === 0){
            logger.debug('No users found');
            return;
        }
        let adjustment = 0;
        logger.info(`adjustment found: ${filtered.join(', ')}`)
        if(filtered.length == 0){
            logger.info(`No adjustment given...`);
            return;
        }
        let amount = filtered.shift();
        if(amount === '++'){
            adjustment = 1;
        }else if(amount === '--'){
            adjustment = -1;
        }else{
            let temp = (+ amount);
            if(!isNaN(temp)){
                adjustment = temp;
            }else{
                message.reply(`Hmm, 🤔. I don't think \`${amount}\` is a number...`);
                return;
            }
        }
        let response = `Wins adjusted by **${adjustment}** for ${users.map(user => `<@${user.id}>`).join(" ")}`;
        if(adjustment > 10){
            response = `Seems like a lot but ok... \n${response}`;
        }
        logger.info(`Adjusting wins by ${adjustment} for user(s): ${users.map(user => user.username).join(', ')}`);
        await adjustUserWins(users, adjustment);
        message.channel.send(response);
        await sendWins(users, message);
	}
}