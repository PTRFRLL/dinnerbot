import { Message } from 'discord.js';
import { Command } from '../../types';
import logger from '../logger';


export const AdjustCommand: Command = {
    name: 'adjust',
    description: 'Manually adjust user wins',
    usage: '@SomeUser [number to adjust by]',
    args: true,
    argCount: 2,
    requiresAuth: true,
    requiresAPIKey: false,
    aliases: ['a'],
    async execute(message: Message, args: Array<string>) {
        if(args.length < 2){
            logger.debug('Not enough args provided');
            message.reply(`Not enough arguments 🤷‍♂️`);
            return;
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
        logger.log(`adjustment found: ${filtered.join(', ')}`)
        if(filtered.length == 0){
            logger.log(`No adjustment given...`);
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
        
        logger.log(`Adjusting wins by ${adjustment} for user(s): ${users.map(user => user.username).join(', ')}`);
        await adjustUserWins(users, adjustment);
        message.channel.send(`Wins adjusted by ${adjustment} for ${users.map(user => `<@${user.id}>`).join(" ")}`);
        await sendWins(users, message);
    }
}