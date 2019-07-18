const Discord = require('discord.js');
const client = new Discord.Client();
const db = require('./lib/db.js');
const logger = require('./lib/log.js');
const bot = require('./lib/discord');
const CONFIG = require('./config');

//when we connect with Discord, sync with DB
client.on('ready', () => {
	let serverID = client.guilds.keys().next().value;
	logger.debug('Running in debug mode...');
	logger.log(`Connected to ${client.guilds.get(serverID).name}`);
	logger.log(`Listening on #${client.channels.get(CONFIG.app.DISCORD_CHANNEL).name}`);
	db.sequelize.sync().then(function() {
		logger.log('DB synced');
	});
	client.user.setActivity(`for chicken dinners 🐔`, {type: 'WATCHING'});
});

//if we cannot connect to Discord, quit app
client.on('error', () => {
	logger.error(`Error connecting to Discord, terminating...`);
	process.exit(1);
});

client.on('disconnect', () => {
	logger.log(`Disconnecting from Discord...`);
});

client.on('reconnecting', () => {
	logger.log(`Attempting to reconnect...`);
});

client.on('message', bot.onMessage);

//when user changes status
client.on('presenceUpdate', bot.presenceUpdate);



try{
	if(!CONFIG.app.DISCORD_BOT_TOKEN || CONFIG.app.DISCORD_BOT_TOKEN === 'DISCORD_BOT_TOKEN' || CONFIG.app.DISCORD_BOT_TOKEN === ''){
		throw Error('Discord bot token not provided in config.js');
	}
	if(!CONFIG.app.DISCORD_CHANNEL || CONFIG.app.DISCORD_CHANNEL === 'DISCORD_CHANNEL_ID' || CONFIG.app.DISCORD_CHANNEL === ''){
		throw Error('Discord channel ID not provided in config.js');
	}
}catch(e){
	logger.error(e.message);
	process.exit(1);
}
//login to Discord
client.login(CONFIG.app.DISCORD_BOT_TOKEN);

module.exports.client = client;