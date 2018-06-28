var moment = require('moment');
require('dotenv').config();

const LOGMODE = process.env.LOGMODE;

module.exports = {
	log: function (message){
		console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')}: ${message}`);
	},
	debug: function (message){
		if(LOGMODE === 'debug') console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} [DEBUG]: ${message}`);
	}
};