var moment = require('moment');
var colors = require('colors');
if(process.env.NODE_ENV === 'DOCKER'){
	CONFIG = require('/config/config');
}else{
	CONFIG = require('../config');
}


module.exports = {
	log: function (message){
		console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')}: ${message}`.green);
	},
	debug: function (message){
		if(CONFIG.app.LOGMODE === 'debug') console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} [DEBUG]: ${message}`.cyan);
	},
	error: function(message){
		console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} [ERROR]: ${message}`.red);
	}
};