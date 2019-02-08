const resize = require('./resize.js');
const compare = require('./compare.js');
const fs = require('fs');
const download = require('./download.js');
const logger = require('./log.js');
const removeFile = require('./utils.js');


async function getScore(url){
	try{
		let file = await download(url);
		let resizedPath = await resize(file);
		let score = await compare(resizedPath);
		logger.debug(score);
		removeFile(file);
		removeFile(resizedPath);
		return score;
	}catch(err){
		logger.error(err);
	}
}

module.exports.getScore = getScore;