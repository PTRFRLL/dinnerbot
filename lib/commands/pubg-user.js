const logger = require('../log');
const db = require("../db_utils");
const pubg = require("../pubg");

module.exports = {
    name: 'pubg-user',
    description: 'Sets your PUBG username',
    usage: '[PUBG username]',
    args: false,
    requiresAuth: false,
    requiresAPIKey: true,
    aliases: ['pu'],
	async execute(message, args) {
        let username = args[0];
        let replace = args[1] && args[1] === '-replace';
        let currentUser = await db.getUserByDiscordId(message.author.id);
        //command with no argument, if they have a user set, display it
        if(!username){
            if(currentUser && currentUser.pubg_username){
                message.reply(`Your PUBG username is set as **${currentUser.pubg_username}**`);
                return;
            }
            //else tell them how to set one
            message.reply(`\nI didn't find a PUBG username for you.\nYou can add one like this:\n\n!pubg-user username`);
            return;
        }
        if(username === '?'){
            //Help command
            message.reply(`Associate your PUBG username to your Discord account.\n\n Usage:\n\`!pubg-user username\` *(e.g. !pubg-user dinnerbot)*\n\nReplace existing name:\n\`!pubg-user username -replace\` *(e.g. !pubg-user dinnerbot -replace)*`);
            return;
        }
        logger.debug(`Passed username: ${username}`);
        //if they passed, 'username' mock them
        if(username === 'username'){
            message.react('🤦');
            message.reply(`\nNo, like you're actual PUBG username...`);
            return;
        }
        //check if usernames match
        if(currentUser && currentUser.pubg_username === username){
            message.reply(`You're username is already set to **${currentUser.pubg_username}**`);
            return;
        }
        //check if existing username isn't replaced with replace flag
        if(currentUser && currentUser.pubg_username && !replace){
            message.reply(`You already have **${currentUser.pubg_username}** as your PUBG username. To change, add the -replace flag:\n\n\`!pubg-user ${username} -replace\``);
            return;
        }
        //get PUBG player data from PUBG API
        let player = await pubg.getPlayerDetails(username);
        if(!player){
            message.reply(`\n:x: I can't find the PUBG username **${username}**\n(usernames are case-sensitive)`)
            return;
        }
        //Set username in DB 
        let updated = await db.updatePlayerUsername(message.author, username, player.id);
        if(updated.pubg_username === username){
            message.reply(`\n:white_check_mark: Your PUBG username has been set to **${username}**`);
        }
	}
}