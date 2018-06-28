const fs = require('fs');
const logger = require('./log.js');

module.exports = function(path){
	fs.unlink(path, err => {
		if(err){
			console.log(err);
		}
		logger.debug(`Utils.js::File was deleted: ${path}`);
	});
};

