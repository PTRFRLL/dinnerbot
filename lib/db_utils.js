const db = require("./db");
const logger = require('./log');

const Sequelize = require('sequelize');
const Op = Sequelize.Op;


/**
 * Insert new player win in wins db table
 * @param {*} player - obj with username, id and match state
 */
const logPlayerWin = async(player) => {
	try{
		logger.log(`Adding win for ${player.username} to wins table`);
		return db.win.create({
			username: player.username,
			discord_id: player.id,
			match: player.state
		});
	}catch(e){
		logger.error(`Failed to insert into wins table: ${e}`);
	}
}


const logNonWin = async(message, score) => {
    logger.log(`Non win added to database`);
    return await db.message.create({
      message_id: message.id,
      score: score
    });
}
  
const checkImgHash = async(hash) => {
    let exists =  await db.hash.findOne({
        where: {
          hash: hash
        }
    });
    return !!exists;
}
  
const recordHash = async(message_id, hash, username) => {
    logger.log(`Adding image hash to DB ${hash}`);
    return await db.hash.create({
        message_id: message_id,
        hash,
        username
    });
}
  
const getLatestNonWin = async() => {
    return await db.message.findAll({
      limit: 1,
      order: [["createdAt", "DESC"]],
      raw: true
    });
}
  
const deleteMessage = async(delete_id) => {
    return await db.message.destroy({
      where: {
        id: delete_id
      }
    });
}

const getUserByDiscordId = async(id) => {
  return await db.user.findOne({
    where: {
      discord_id: id
    }
  });
};

const updatePlayerUsername = async(user, username, pubg_id) => {
  let dbUser = await db.user.findOne({
    where: {
      discord_id: user.id
    }
  });
  if(dbUser){
    logger.log(`${user.username} found, updating PUBG username to ${username} (${pubg_id})`);
    return await dbUser.update({pubg_username: username, pubg_id});
  }else{
    logger.log(`${user.username} not found, creating and setting PUBG data: ${username} (${pubg_id})`);
    return await db.user.create({
      username: user.username,
      discord_id: user.id,
      wins: 0, 
      pubg_username: username,
      pubg_id
    });
  }
};

const findPUBGUserFromList = async(list) => {
  let user = await db.user.findOne({
    where: {
      pubg_id: {
        [Op.ne]: null
      },
      discord_id: {
        [Op.in]: list
      }
    }
  });
  return user;
};

const logUserWins = async(users) => {
    return await Promise.all(
        users.map(async messageUser => {
        let user = await db.user.findOne({
            where: {
            discord_id: messageUser.id
            }
        });
        if (user) {
            let updatedUser = await user.increment("wins");
            logger.log(`${messageUser.username} found, incrementing wins...`);
            return updatedUser.reload();
        } else {
            logger.log(`${messageUser.username} was not found, creating user...`);
            return await db.user.create({
              username: messageUser.username,
              discord_id: messageUser.id,
              wins: 1
            });
        }
        })
    );
}

const adjustUserWins = async(users, adjustment) => {
  return await Promise.all(
    users.map(async user => {
      let found = await db.user.findOne({
        where: {
          discord_id: user.id
        }
      });
      if(!found){
        logger.debug(`${user.username} not found in DB, creating...`);
        return await db.user.create({
          username: user.username,
          discord_id: user.id,
          wins: adjustment
        });
      }
      let updatedUser = await found.increment({wins: adjustment});
      logger.log(`Adjusting ${user.username}'s wins by ${adjustment}...`);
      return updatedUser.reload();
    })
  );
}
  
const getWins = async(users) => {
    return await Promise.all(
      users.map(async messageUser => {
        let user = await db.user.findOne({
          where: {
            discord_id: messageUser.id
          }
        });
        if (user) {
          return user;
        } else {
          logger.log(`User not found`);
          return { username: messageUser.username, wins: undefined };
        }
      })
    );
}

const utils = {
  deleteMessage, 
  getLatestNonWin,
  logNonWin,
  logUserWins,
  getWins,
  checkImgHash,
  recordHash,
  logPlayerWin,
  updatePlayerUsername,
  getUserByDiscordId,
  findPUBGUserFromList,
  adjustUserWins
};

module.exports = utils;