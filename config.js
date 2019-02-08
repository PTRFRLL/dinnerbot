require('dotenv').config();
const env = process.env.MODE;

let good = ['Whatever you say...', `You're the boss!`, `Ok, fine!`, `:shrug:`];
let bad = [':middle_finger:', 'Who are you again?', ':poop:', 'How bout you drink a nice glass of shut the hell up :coffee:', 'Could you fucking not?', `You're stupid and I hate you`];

const prod = {
	app: {
		DISCORD_BOT_TOKEN: 'DISCORD BOT TOKEN HERE',
		DISCORD_CHANNEL: 'DISCORD CHANNEL ID',
		IMG_SCORE_THRESHOLD: 15000,
		LOGMODE: 'prod',
		AUTH_USERS: {
			//can provide role names, user ids or both
			users: [''], //user ids
			roles: [''] //name of role
		},
		BOT_RESPONSES_GOOD: good,
		BOT_RESPONSES_BAD: bad
	},
	db: {
		DATABASE_PATH:  __dirname + '/data/db.sqlite'
	}
};

const config = {
	prod
};

module.exports = config[env];