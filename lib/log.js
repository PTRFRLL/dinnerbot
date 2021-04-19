var colors = require('colors');
const winston = require('winston');
const {getTimestamp, LONG_DATE_FORMAT} = require('./timestamp');

const LOGMODE = process.env.LOGMODE || "prod";


const logConfiguration = {
    'transports': [
        new winston.transports.Console(),
		new winston.transports.File({
            level: 'debug',
            // Create the log directory if it does not exist
            filename: './data/debug.log',
            maxsize: 10000000,
            maxFiles: 2
        })
    ],
	format: winston.format.combine(
        winston.format.timestamp({
			format: 'MMM-DD-YYYY HH:mm:ss'
		}),
		winston.format.colorize(),
		winston.format.align(),
        winston.format.printf(info => `${[info.timestamp]} [${info.level}]: ${info.message}`),
    )
};

const logger = winston.createLogger(logConfiguration);

module.exports = logger;