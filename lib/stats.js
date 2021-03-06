const isWithinInterval = require('date-fns/isWithinInterval');
const sub = require('date-fns/sub');

const {findPUBGUserFromList} = require("./db_utils");
const logger = require('./log')('stats');
const {getLatestWin} = require("./pubg");
const { createWinningStatEmbed } = require('./discord');
const {STATS} = require('./constants');
const {getTimestamp} = require('./utils');

/**
 * Determine if found win is recent
 * @param {*} stats - PUBG stats object
 * @returns true if recent, otherwise false
 */
const isRecentWin = (stats) => {
    if(!stats?.date){
      logger.debug(`Date not provided, not recent`);
      return false;
    }
    if(stats?.duration){
      return isRecentByDuration(stats.date, stats.duration);
    }else{
      return isRecentByStartTime(stats.date);
    }
}

/**
 * Determines if recent by calculating endtime based on start date and duration
 * @param {*} startDate - ISO string format
 * @param {*} duration - in seconds
 * @returns true if recent
 */
const isRecentByDuration = (startDate, duration) => {
  const THRESHOLD_IN_MIN = 5;
  logger.debug(`Calculating endtime based on start and duration`);
  const endTime = calculateEndTime(startDate, duration);
  logger.debug(`EndTime: ${endTime}`);
  const lastXMin = new Date(Date.now() - ((THRESHOLD_IN_MIN * 1000) * 60));
  logger.debug(`Now: ${lastXMin}`)
  if(endTime.getTime() > lastXMin.getTime()){
    logger.debug(`Match end time within last ${THRESHOLD_IN_MIN} min`);
    return true;
  }else{
    logger.debug(`Match end time NOT within last ${THRESHOLD_IN_MIN} min`);
    return false;
  }
}

/**
 * Determines if recent by checking if startDate is withing last X min (default 45 min)
 * @param {*} startDate - start date of match
 * @param {*} min - considered recent if within last
 * @returns 
 */
const isRecentByStartTime = (startDate, min = 45) => {
  logger.debug('Missing duration, calculating based on startTime');
  const end = new Date();
  const start = sub(new Date(), {
    minutes: min
  });
  const statDate = new Date(startDate);
  if(isWithinInterval(statDate, {
    start,
    end
  })){
    logger.debug(`Stat date (${statDate}) within last ${min} min`);
    return true;
  }else{
    logger.debug(`Stat date (${statDate}) NOT within last ${min} min`);
    return false;
  }
}

/**
 * Calculate endtime give start time and duration
 * @param {*} start - start time in ISO string format
 * @param {*} duration - in seconds
 * @returns 
 */
const calculateEndTime = (start, duration) => {
  const startTime = new Date(start);
  return new Date(startTime.getTime() + (duration * 1000));
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
    recent: isRecentWin(stats)
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
    if(stats){
      logger.info(`Stats found but not recent enough, stat date is ${getTimestamp(stats.date)}, trying again...`);
    }else{
      logger.info(`No stats found yet...`)
    }
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
      logger.info(`Got ID: ${pubgId}, querying stats...`);
      let statusMessage = await channel.send(`Winning stats incoming... :timer:`);

      try{
        let stats = await findRecentStats(pubgId, statusMessage);
        await sendWinningStats(stats, channel, statusMessage);
      }catch(err){
        //stats not found
        logger.error(err);
        statusMessage.delete();
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