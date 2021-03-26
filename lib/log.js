var colors = require('colors');
if(process.env.NODE_ENV === 'DOCKER'){
	CONFIG = require('/config/config');
}else{
	CONFIG = require('../config');
}
const {getTimestamp, LONG_DATE_FORMAT} = require('./timestamp');


module.exports = {
	/**
	 * Log message to console with timestamp
	 * @param {string} message 
	 */
	log: function (message){
		console.log(`${getTimestamp(LONG_DATE_FORMAT)}: ${message}`.green);
	},
	/**
	 * Log debug message to console with timestamp (only shown when logmode set to debug)
	 * @param {string} message 
	 */
	debug: function (message){
		if(CONFIG.app.LOGMODE === 'debug') console.log(`${getTimestamp(LONG_DATE_FORMAT)} [DEBUG]: ${message}`.cyan);
	},
	/**
	 * Log error message to console with timestamp
	 * @param {string} message 
	 */
	error: function(message){
		console.log(`${getTimestamp(LONG_DATE_FORMAT)} [ERROR]: ${message}`.red);
	}
};