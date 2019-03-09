require('dotenv').config();
const env = process.env.MODE;

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

const prod = {
	app: {
		DISCORD_BOT_TOKEN: 'DISCORD BOT TOKEN HERE',
		DISCORD_CHANNEL: 'DISCORD CHANNEL ID',
		IMG_SCORE_THRESHOLD: 15000,
		LOGMODE: 'prod',
		AUTH_USER_IDS: [''], //discord user ids
		BOT_RESPONSES_GOOD: good,
		BOT_RESPONSES_BAD: bad,
		BOT_PRESENCE_RESPONSES: winner,
		BOT_SPECTATOR_RESPONSES: spectator
	},
	db: {
		DATABASE_PATH:  __dirname + '/data/db.sqlite'
	}
};

const config = {
	prod
};

module.exports = config[env];