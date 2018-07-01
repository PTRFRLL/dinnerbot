const resize = require('./resize.js');
const compare = require('./compare.js');
const fs = require('fs');
const download = require('./download.js');
const logger = require('./log.js');
const removeFile = require('./utils.js');


async function getScore(url){
	const file = await download(url);
	const resizedPath = await resize(file);
	const score = await compare(resizedPath);
	removeFile(file);
	removeFile(resizedPath);
	return score;
}

module.exports.getScore = getScore;