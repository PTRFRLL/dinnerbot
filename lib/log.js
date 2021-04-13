var colors = require('colors');
const {getTimestamp, LONG_DATE_FORMAT} = require('./timestamp');

const LOGMODE = process.env.LOGMODE ?? "prod";

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
		if(LOGMODE === 'debug') console.log(`${getTimestamp(LONG_DATE_FORMAT)} [DEBUG]: ${message}`.cyan);
	},
	/**
	 * Log error message to console with timestamp
	 * @param {string} message 
	 */
	error: function(message){
		console.log(`${getTimestamp(LONG_DATE_FORMAT)} [ERROR]: ${message}`.red);
	}
};