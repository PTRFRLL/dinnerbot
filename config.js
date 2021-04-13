const env = process.env.NODE_ENV || 'DOCKER';
const path = require('path');

const dev = {
	app: {
		DISCORD_BOT_TOKEN: 'DISCORD_BOT_TOKEN',
		DISCORD_CHANNEL: 'DISCORD_CHANNEL_ID',
		IMG_SCORE_THRESHOLD: 20000,
		ALLOWED_EXT: ['png', 'jpeg', 'jpg'],
		LOGMODE: process.env.LOG_MODE || 'debug',
		AUTH_USERS: {
			//can provide role names, user ids or both
			users: [''], //user ids
			roles: [''] //name of role
		},
		COMMAND_PREFIX: '!',
		STAT_WAIT_TIME_IN_SECONDS: 100,
		STAT_RETRY_TIME_IN_SECONDS: 30,
		STAT_ABANDON_AFTER_IN_SECONDS: 300 //how long should stats try to find latest win, default is 300
	},
	db: {
		DATABASE_PATH:  path.join(__dirname, 'data', 'dinnerbot.sqlite')
	},
	services: {
		PUBG_API_KEY: ''
	}
};

const DOCKER = {
	app: {
		DISCORD_BOT_TOKEN: process.env.BOT_TOKEN,
		DISCORD_CHANNEL: process.env.CHANNEL_ID,
		IMG_SCORE_THRESHOLD: 20000,
		ALLOWED_EXT: ['png', 'jpeg', 'jpg'],
		LOGMODE: process.env.LOG_MODE || 'prod',
		AUTH_USERS: {
			//can provide role names, user ids or both
			users: [''], //user ids
			roles: [''] //name of role
		},
		COMMAND_PREFIX: '!',
		STAT_WAIT_TIME_IN_SECONDS: 100, //how long to wait before querying stats
		STAT_RETRY_TIME_IN_SECONDS: 30, //how often to retry query for stats
		STAT_ABANDON_AFTER_IN_SECONDS: 300 //how long should stats try to find latest win, default is 300
	},
	db: {
		DATABASE_PATH:  path.join('/', 'data', 'dinnerbot.sqlite')
	},
	services: {
		PUBG_API_KEY:  process.env.PUBG_API_KEY
	}
};

const test = {
	app: {
		LOGMODE: 'prod',
		ALLOWED_EXT: ['png', 'jpeg', 'jpg']
	},
	db: {
		DATABASE_PATH: "sqlite::memory:"
	}
}


const config = {
	dev,
	DOCKER,
	test
};

module.exports = config[env];