const compare = require('./compare.js');
const logger = require('./log.js');

const getScore = async(path) => {
	try{
		let score = await compare(path);
		logger.debug(score);
		return score;
	}catch(err){
		logger.error(err);
	}
}

module.exports = {
	getScore
};