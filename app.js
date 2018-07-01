require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const _ = require('lodash');
const db = require('./lib/db.js');
const score = require('./lib/score.js');
const logger = require('./lib/log.js');
const bot = require('./lib/discord');

//when we connect with Discord, sync with DB
client.on('ready', () => {
	logger.debug('Running in debug mode...');
	logger.log('Connected and listening...');
	db.sequelize.sync().then(function() {
		logger.log('DB synced...');
	});
});

//if we cannot connect to Discord, quit app
client.on('error', () => {
	logger.error(`Error connecting to Discord, terminating...`);
	process.exit(1);
});

//on message event
client.on('message', bot.onMessage);

//login to Discord
client.login(process.env.SECRET);
