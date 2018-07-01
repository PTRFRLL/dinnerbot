const fs = require('fs');
const axios = require('axios');
const mime = require('mime-types');
const logger = require('./log.js');

module.exports = async function(url){
	const response = await axios({
		method: 'GET',
    	url: url,
    	responseType: 'stream'
	});
	let extension = mime.extension(response.headers['content-type']);
	let path = __dirname + `/../data/img/temp.${extension}`;
	response.data.pipe(fs.createWriteStream(path))

	return new Promise((resolve, reject) => {
	    response.data.on('end', () => {
	    	logger.debug('Download.js::File downloaded');
	      	resolve(path)
	    })
	    response.data.on('error', () => {
	      reject()
	    })
  	})
}



