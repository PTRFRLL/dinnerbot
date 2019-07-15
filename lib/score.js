const compare = require('./compare.js');
const logger = require('./log.js');
const {download, resize, deleteFile} = require('./utils.js');

const getScore = async(url) => {
	try{
		let file = await download(url);
		let resizedPath = await resize(file);
		let score = await compare(resizedPath);
		logger.debug(score);
		deleteFile(file);
		await deleteFile(resizedPath);
		return score;
	}catch(err){
		logger.error(err);
	}
}

module.exports = {
	getScore
};