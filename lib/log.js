const path = require('path');
const winston = require('winston');

let DATA_PATH = process.env.DATA_PATH || "/data";

const customFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'MMM-DD-YYYY HH:mm:ss'
    }),
    winston.format.printf(info => `${[info.timestamp]} [${info.level}]: ${info.message}`),
)

const logConfiguration = {
    'transports': [
        new winston.transports.Console({
            level: 'info',
            format: winston.format.combine(winston.format.colorize(), customFormat)
        }),
        new winston.transports.File({
            filename: path.join(DATA_PATH, 'error.log'),
            level: 'error',
            format: customFormat
        })
    ],
};

const logger = winston.createLogger(logConfiguration);

if(process.env.LOGMODE === 'debug'){
    logger.add(new winston.transports.File({
        level: 'debug',
        filename: path.join(DATA_PATH, 'debug.log'),
        maxsize: 10000000,
        maxFiles: 2,
        format: customFormat
    }))
}

module.exports = logger;