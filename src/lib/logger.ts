import {getTimestamp, LONG_DATE_FORMAT} from './timestamp';

const log = (message: string) => {
    console.log(`${getTimestamp(LONG_DATE_FORMAT)}: ${message}`)
};

const debug = (message: string) => {
    if(process.env.LOG_MODE === 'debug') console.log(`${getTimestamp(LONG_DATE_FORMAT)} [DEBUG]: ${message}`)
};

const error = (message: string) => {
    console.error(`${getTimestamp(LONG_DATE_FORMAT)} [ERROR]: ${message}`)
};

const logger = {
    log, 
    debug,
    error
};

export default logger;