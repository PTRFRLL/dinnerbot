var moment = require('moment');
var colors = require('colors');
require('dotenv').config();

const MODE = process.env.MODE;

module.exports = {
	log: function (message){
		console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')}: ${message}`.green);
	},
	debug: function (message){
		if(MODE === 'debug') console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} [DEBUG]: ${message}`.cyan);
	},
	error: function(message){
		console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} [ERROR]: ${message}`.red);
	}
};