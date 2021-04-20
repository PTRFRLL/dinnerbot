const logger = require('../log')('set-pubg-user');
const db = require("../db_utils");

module.exports = {
    name: 'get-pubg',
    description: 'Display your PUBG username',
    usage: '',
    args: false,
    requiresAuth: false,
    requiresAPIKey: true,
    aliases: ['gp'],
	async execute(message, args) {
        let currentUser = await db.getUserByDiscordId(message.author.id);
        if(currentUser?.pubg_username){
            message.reply(`You're PUBG username is set to **${currentUser.pubg_username}**`);
            return;
        }else{
            message.reply(`You don't have a PUBG username associated. Use the \`${process.env.COMMAND_PREFIX}set-pubg\` command to set one`);
            return;
        }
	}
}