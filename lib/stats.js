const {findPUBGUserFromList} = require("./db_utils");
const logger = require('./log')('stats');
const {getLatestWin} = require("./pubg");
const moment = require('moment');
const { createWinningStatEmbed } = require('./discord');
const {STATS} = require('./constants');

/**
 * Determine if most recent win is within last X minutes
 * @param {*} date date of win
 * @param {*} min number of minutes considered recent
 * @returns 
 */
const isRecentWin = (date, min = 45) => {
    if(!date){
      logger.debug(`Date not provided, not recent`);
      return false;
    }
    const now = moment();
    const begin = moment().subtract(min, 'm');
    const statDate = moment(date);
    if(statDate.isBetween(begin, now)){
      logger.debug(`Stat date is within last ${min} min`);
      return true;
    }else{
      logger.debug(`Stat date NOT within last ${min} min: ${statDate.format('YYYY-MM-DD HH:mm:ss')}`);
      return false;
    }
}

/**
 * Creates and sends stats message embed
 * @param {*} stats - stat object
 * @param {*} user - Discord user
 * @param {*} channel - Discord TextChannel 
 * @param {*} statusMessage - Message sent to inform user stats are incoming
 */
const sendWinningStats = async(stats, channel, statusMessage) => {
  const embed = await createWinningStatEmbed(stats, stats.team.length > 0);
  statusMessage.delete();
  channel.send(embed);
}

/**
 * Promisified setTimeout
 * @param {*} timeoutInMs 
 * @returns promise that resolves after given timeout
 */
const wait = async(timeoutInMs) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, timeoutInMs)
  })
};

/**
 * Query PUBG for stats and determine if they're considered "recent"
 * @param {*} pubgId 
 * @returns stats and recent flag
 */
const queryStats = async(pubgId) => {
  let stats = await getLatestWin(pubgId);
  return {
    stats,
    recent: isRecentWin(stats?.date)
  }
}

/**
 * Queries PUBG api to find newly added stats to their API
 * Loops over a given retry and timeout time 
 * @param {*} pubId players PUBG account ID
 * @param {*} statusMessage Discord Message used to tell user of stat lookup progress
 * @returns recent stats
 * @throws error if no recent stats found
 */
const findRecentStats = async(pubId, statusMessage) => {
  let timeInSec = STATS.WAIT_TIME_IN_SECONDS;
  logger.debug(`Waiting ${timeInSec} sec...`);
  await wait(timeInSec * 1000);

  let retryTime = STATS.RETRY_TIME_IN_SECONDS;
  let retryTimeInMs = retryTime * 1000;

  let {stats, recent} = await queryStats(pubId);
  if(stats && recent){
    logger.debug(`Recent stats found`);
    return stats;
  }else{
    logger.info(`Stats found but not recent enough, stat date is ${moment(stats.date).format('YYYY-MM-DD HH:mm:ss')}, trying again...`);
    let timelimit = STATS.ABANDON_AFTER_IN_SECONDS;
    let loopCount = 1;
    statusMessage.edit(`No stats on PUBG API yet, trying again...`);
    return new Promise((resolve, reject) => {
      let interval = setInterval(async () => {
        timeInSec += retryTime;
        let {stats, recent} = await queryStats(pubId);
        if(stats && recent){
          clearInterval(interval);
          logger.info(`Found stats after ${timeInSec} seconds`);
          resolve(stats);
        }else if(timeInSec >= timelimit){
          clearInterval(interval);
          logger.info(`Stats still not found after ${timeInSec} seconds`);
          statusMessage.edit(`Couldn't find any stats :man_shrugging:`);
          reject();
        }else{
          statusMessage.edit(`No stats on PUBG API yet, trying again...  _Take ${loopCount}_`);
          logger.info(`No recent stats not found yet, take ${loopCount}, seconds so far: ${timeInSec}`);
          loopCount++;
        }
      }, retryTimeInMs);
    })
    
  }
}

/**
 * Automatically fetchs last user win
 * @param {*} winners list of users
 * @param {*} channel discord channel 
 */
const autoStats = async(winners, channel, presenceId) => {
  try{
    //grab pubg_id so we can lookup stats
    let pubgId = await getPUBGId(winners, presenceId);
    if(pubgId){
      logger.info(`Got ID, querying stats...`);
      let statusMessage = await channel.send(`Winning stats incoming... :timer:`);

      try{
        let stats = await findRecentStats(pubgId, statusMessage);
        await sendWinningStats(stats, channel, statusMessage);
      }catch(err){
        //stats not found
      }
    }else{
      logger.info(`No PUBG IDs found, no stats`)
    }
  }catch(e){
    logger.error(e);
  }
}

const getPUBGId = async(winners, presenceId) => {
  if(presenceId){
    logger.info(`Using presence found in partyId: ${presenceId}`)
    return presenceId;
  }else{
    let user = await findPUBGUserFromList(winners.map(winner => winner.user.id));
    if(user){
      logger.info(`PUBG ID found among winners (${user.username}): ${user.pubg_id}`)
      return user.pubg_id;
    }
  }
  return null;
}

module.exports = {
    autoStats
}