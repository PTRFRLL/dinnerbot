const Push = require('pushover-notifications');
const logger = require('./log.js');

if(process.env.NODE_ENV === 'DOCKER'){
    CONFIG = require('/config/config');
}else{
    CONFIG = require('../config');
}


if(!CONFIG.services.PUSHOVER_USER || !CONFIG.services.PUSHOVER_TOKEN){
    logger.error('Missing Pushover credentials');
}

const pushover = new Push({
  user: CONFIG.services.PUSHOVER_USER,
  token: CONFIG.services.PUSHOVER_TOKEN,
});

const sendNotification = (message, title) => {
    return new Promise((resolve, reject) => {
        const notification = {
            message,
            title
        };
        pushover.send(notification, (err, json) => {
            if(err){
                logger.error(err);
                reject(err);
            }
            let res = JSON.parse(json);
            if(res.status == 1){
                logger.log(`Pushover notification sent: ${message}`);
                resolve();
            }
        });
    });
}

const sendNotificationWithAttachment = (message, file, title) => {
	return new Promise((resolve, reject) => {
		const notification = {
			message,
			title,
			file
		}
		pushover.send(notification, (err, json) => {
			if(err){
				logger.error(err);
				reject(err);
			}
			let res = JSON.parse(json);
			if(res.status == 1){
				logger.log(`Pushover notification sent with image: ${message}`);
				resolve();
			}
		});
	})
}

module.exports = {
    sendNotification,
    sendNotificationWithAttachment
}