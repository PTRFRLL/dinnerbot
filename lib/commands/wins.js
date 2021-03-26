const logger = require('../log');
const discord = require('../discord');

module.exports = {
    name: 'wins',
    description: 'Get PUBG wins counted by this bot for each tagged user.',
    requiresAuth: false,
    aliases: ['w'],
    usage: '@SomeUser',
	async execute(message, args) {
        let users = await discord.getMessageUsers(message);
        await discord.sendWins(users, message);
	}
}