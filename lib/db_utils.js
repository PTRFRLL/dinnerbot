const {User, Message, Hash} = require('./db');
const logger = require('./log');

const removeMessageFromDB = async(id) => {
	try{
		logger.log(`Removed non-win message with ${id}`)
		return !!await Message.destroy({
			where: {
				id: id
			}
		});
	}catch(e){
		logger.debug(`Error removing message from DB`);
		return false;
	}
}

const getLatestNonWin = async() => {
	return await Message.findAll({
		limit: 1,
		order: [['createdAt', 'DESC']],
		raw: true
	});
}

const logNonWin = async(message, score) => {
	logger.log(`Non win added to database`);
	return await Message.create({
		message_id: message.id,
		score: score
	});
}

const logUserWins = async (users) => {
	return await Promise.all(users.map(async (messageUser) => {
		let user = await User.findOne({
			where: {
				discord_id: messageUser.id
			}
		});
		if(user){
			let updatedUser = await user.increment('wins');
			logger.log(`${messageUser.username} found, incrementing wins...`);
			return updatedUser.reload();
		}else{
			logger.log(`${messageUser.username} was not found, creating user...`);
			return await User.create({
				username: messageUser.username,
				discord_id: messageUser.id,
				wins: 1
			});
		}
	}));
}

const getWins = async (users) => {
	return await Promise.all(users.map(async (messageUser) => {
		let user = await User.findOne({
			where: {
				discord_id: messageUser.id
			}
		});
		if(user){
			return user;
		}else{
			logger.log(`User not found`);
			return {username: messageUser.username, wins: undefined};
		}
	}));
}

const checkImgHash = async(hash) => {
    let exists =  await Hash.findOne({
        where: {
        hash: hash
        }
    });
    return !!exists;
}
  
const recordHash = async(message_id, hash, username) => {
    logger.log(`Adding image hash to DB ${hash}`);
    return await Hash.create({
        message_id: message_id,
        hash,
        username
    });
}

const utils = {
	removeMessageFromDB, 
    getLatestNonWin,
    logNonWin,
    logUserWins,
	getWins,
	recordHash,
	checkImgHash
}

module.exports = utils;