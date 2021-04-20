const winston = require('winston');

const customFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'MMM-DD-YYYY HH:mm:ss'
    }),
    winston.format.printf(info => `${[info.timestamp]} [${info.level}]: ${info.message}`),
)

const logConfiguration = {
    'transports': [
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), customFormat)
        }),
		new winston.transports.File({
            level: 'debug',
            // Create the log directory if it does not exist
            filename: './data/debug.log',
            maxsize: 10000000,
            maxFiles: 2
        })
    ],
	format: customFormat
};

const logger = winston.createLogger(logConfiguration);

module.exports = logger;