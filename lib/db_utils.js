const db = require("./db");
const logger = require('./log')('db_utils');
const { Op } = require("sequelize");
 

/**
 * Check if given hash already exists in database
 * @param {string} hash 
 * @returns true if hash exists in db
 */
const checkImgHash = async(hash) => {
    let exists =  await db.hash.findOne({
        where: {
          hash: hash
        }
    });
    return !!exists;
}

/**
 * Adds image hash to database
 * @param {*} message_id 
 * @param {*} hash 
 * @param {*} username 
 * @returns created hash model
 */
const recordHash = async(message_id, hash, username) => {
    logger.info(`Adding image hash to DB ${hash}`);
    return db.hash.create({
        message_id: message_id,
        hash,
        username
    });
}

/**
 * Get user record from DB by Discord user ID
 * @param {*} discordId 
 * @returns user record OR null
 */
const getUserByDiscordId = async(discordId) => {
  return db.user.findOne({
    where: {
      discord_id: discordId
    }
  });
};

/**
 * Update Player with PUBG user information
 * @param {*} user - discord user
 * @param {*} PUBGUsername - PUBG username
 * @param {*} pubg_id - PUBG user id
 * @returns User record with PUBG username and ID set
 */
const updatePlayerUsername = async(user, PUBGUsername, pubg_id) => {
  let dbUser = await db.user.findOne({
    where: {
      discord_id: user.id
    }
  });
  if(dbUser){
    logger.info(`${user.username} found, updating PUBG username to ${PUBGUsername} (${pubg_id})`);
    return dbUser.update({pubg_username: PUBGUsername, pubg_id});
  }else{
    logger.info(`${user.username} not found, creating and setting PUBG data: ${PUBGUsername} (${pubg_id})`);
    return db.user.create({
      username: user.username,
      discord_id: user.id,
      wins: 0, 
      pubg_username: PUBGUsername,
      pubg_id
    });
  }
};

/**
 * Finds a user with a PUBG ID given a list of Discord user IDs
 * @param {*} userIdList - list of Discord user ids 
 * @returns - user record with PUBG Id OR null
 */
const findPUBGUserFromList = async(userIdList) => {
  return db.user.findOne({
    where: {
      pubg_id: {
        [Op.ne]: null
      },
      discord_id: {
        [Op.in]: userIdList
      }
    }
  });
};

/**
 * Increments give users win count by one
 * @param {*} users - Discord users
 * @returns list of updated user records
 */
const logUserWins = async(users) => {
    return Promise.all(
        users.map(async messageUser => {
          let user = await db.user.findOne({
              where: {
              discord_id: messageUser.id
              }
          });
          if (user) {
              let updatedUser = await user.increment("wins");
              logger.info(`${messageUser.username} found in DB, incrementing wins...`);
              return updatedUser.reload();
          } else {
              logger.info(`${messageUser.username} was not found in DB, creating user...`);
              return db.user.create({
                username: messageUser.username,
                discord_id: messageUser.id,
                wins: 1
              });
          }
        })
    );
}

/**
 * Adjusts given users win count
 * @param {*} users - discord user
 * @param {number} adjustment - number of wins to adjust  
 * @returns list of update user records
 */
const adjustUserWins = async(users, adjustment) => {
  return Promise.all(
    users.map(async user => {
      let found = await db.user.findOne({
        where: {
          discord_id: user.id
        }
      });
      if(!found){
        logger.debug(`${user.username} not found in DB, creating...`);
        return db.user.create({
          username: user.username,
          discord_id: user.id,
          wins: adjustment
        });
      }
      let updatedUser = await found.increment({wins: adjustment});
      logger.info(`Adjusting ${user.username}'s wins by ${adjustment}...`);
      return updatedUser.reload();
    })
  );
}

/**
 * Get user records for given list of Discord users
 * @param {*} users 
 * @returns list of user records
 */
const getWins = async(users) => {
    return Promise.all(
      users.map(async messageUser => {
        let user = await db.user.findOne({
          where: {
            discord_id: messageUser.id
          }
        });
        if (user) {
          return user;
        } else {
          logger.info(`User not found`);
          return { username: messageUser.username, wins: undefined };
        }
      })
    );
}

const utils = {
  logUserWins,
  getWins,
  checkImgHash,
  recordHash,
  updatePlayerUsername,
  getUserByDiscordId,
  findPUBGUserFromList,
  adjustUserWins
};

module.exports = utils;