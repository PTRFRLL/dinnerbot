const env = process.env.NODE_ENV || 'DOCKER';
const path = require('path');

let good = [
	'Whatever you say...', 
	`You're the boss!`, 
	`Ok, fine!`, 
	`:shrug:`
];
let bad = [
	':middle_finger:', 
	'Who are you again?', 
	':poop:', 
	'How bout you drink a nice glass of shut the hell up :coffee:', 
	'Could you fucking not?', 
	`You're stupid and I hate you`
];

//[USER] is replaced by user(s) mention e.g. @PTRFRLL
let winner = [
	'Do I smell chicken :chicken:, [USER]?', 
	'What\'s that smell, [USER]?', 
	'Mmm, something smells good [USER]', 
	'[USER], did you order Popeyes :chicken:?', 
	'[USER] Looks like we got some winners over here :fork_knife_plate:',
	'[USER] Look at these fucking guys :eyes:'
];
let spectator = [
	'Couldn\'t make it to the end, [USER]? :skull_crossbones:', 
	'At least you\'re light, [USER] :stuck_out_tongue_winking_eye:', 
	'[USER] gettin carried per usual...', 
	'[USER] for MVP :smiling_imp:', 
	'[USER], there for moral support... :angel:'
];

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
		BOT_RESPONSES_GOOD: good,
		BOT_RESPONSES_BAD: bad,
		BOT_PRESENCE_RESPONSES: winner,
		BOT_SPECTATOR_RESPONSES: spectator,
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
		BOT_RESPONSES_GOOD: good,
		BOT_RESPONSES_BAD: bad,
		BOT_PRESENCE_RESPONSES: winner,
		BOT_SPECTATOR_RESPONSES: spectator,
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