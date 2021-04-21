const logger = require('../log')('adjust');
const {getMessageUsers, sendWins} = require('../discord');
const {adjustUserWins} = require('../db_utils');

module.exports = {
    name: 'adjust',
    description: 'Manually adjust user wins',
    usage: '@SomeUser [number to adjust by]',
    args: true,
    argCount: 2,
    requiresAuth: true,
    aliases: ['a'],
	async execute(message, args) {
        if(args.length < 2){
            logger.debug('Not enough args provided');
            return message.reply(`Not enough arguments 🤷‍♂️`); 
        }
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
        if(filtered[0] === '++'){
            adjustment = 1;
        }else if(filtered[0] === '--'){
            adjustment = -1;
        }else{
            let temp = (+ filtered[0]);
            if(!isNaN(temp)){
                adjustment = temp;
            }else{
                message.reply(`Hmm, 🤔. Is \`${filtered[0]}\` a number?`);
                return;
            }
        }
        
        logger.info(`Adjusting wins by ${adjustment} for user(s): ${users.map(user => user.username).join(', ')}`);
        await adjustUserWins(users, adjustment);
        message.channel.send(`Wins adjusted by ${adjustment} for ${users.map(user => `<@${user.id}>`).join(" ")}`);
        await sendWins(users, message);
	}
}