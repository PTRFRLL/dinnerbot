require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const _ = require('lodash');
const db = require('./lib/db.js');
const score = require('./lib/score.js');
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
});

//if we cannot connect to Discord, quit app
client.on('error', () => {
	logger.error(`Error connecting to Discord, terminating...`);
	process.exit(1);
});

client.on('disconnect', () => {
	logger.log(`Disconnecting from Discord...`);
});

//on message event
client.on('message', bot.onMessage);

//login to Discord
client.login(CONFIG.app.DISCORD_BOT_TOKEN);


module.exports.client = client;