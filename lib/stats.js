let CONFIG;
if(process.env.NODE_ENV === 'DOCKER'){
	CONFIG = require('/config/config');
}else{
	CONFIG = require('../config');
}
const {findPUBGUserFromList} = require("./db_utils");
const logger = require('./log');
const pubg = require("./pubg");
const moment = require('moment');
const { createWinningStatEmbed } = require('./discord');

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

const sendWinningStats = async(stats, user, channel, statusMessage) => {
  const embed = await createWinningStatEmbed(stats, user.pubg_username, stats.team.length > 0);
  statusMessage.delete();
  channel.send(embed);
}

const wait = async(timeoutInMs) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, timeoutInMs)
  })
};


const queryStats = async(pubgId) => {
  let stats = await pubg.getLatestWin(pubgId);
  return {
    stats,
    recent: isRecentWin(stats?.date)
  }
}

/**
 * Automatically fetchs last user win
 * @param {*} winners list of users
 * @param {*} channel discord channel 
 */
const autoStats = async(winners, channel) => {
  try{
    //grab pubg_id so we can lookup stats
    let user = await findPUBGUserFromList(winners.map(winner => winner.user.id));
    if(user){
      let sentMsg = await channel.send(`Winning stats incoming... :timer:`);
      logger.log(`PUBG ID found for a winner (${user.username}), querying stats...`);

      logger.debug(`Waiting ${CONFIG.app.STAT_WAIT_TIME_IN_SECONDS}...`);
      await wait(CONFIG.app.STAT_WAIT_TIME_IN_SECONDS);

      let retryTime = CONFIG.app.STAT_RETRY_TIME_IN_SECONDS || 30;
      let retryTimeInMs = retryTime * 1000;

      let {stats, recent} = await queryStats(user.pubg_id);
      if(stats && recent){
        logger.debug(`Recent stats found, sending message`);
        await sendWinningStats(stats, user, channel, sentMsg);
      }else{
        logger.log(`Stats found but not recent enough, stat date is ${moment(stats.date).format('YYYY-MM-DD HH:mm:ss')}, trying again...`);
        let timeInSec = CONFIG.app.STAT_WAIT_TIME_IN_SECONDS || 100;
        let timelimit = CONFIG.app.STAT_ABANDON_AFTER_IN_SECONDS || 300;
        let loopCount = 1;
        sentMsg.edit(`No stats on PUBG API yet, trying again...  _Take ${loopCount}_`);
        let interval = setInterval(async () => {
          timeInSec += retryTime;
          let {stats, recent} = await queryStats(user.pubg_id);
          if(stats && recent){
            clearInterval(interval);
            logger.log(`Found stats after ${timeInSec} seconds`);
            await sendWinningStats(stats, user, channel, sentMsg);
          }else if(timeInSec >= timelimit){
            clearInterval(interval);
            logger.log(`Stats still not found after ${timeInSec} seconds`);
            sentMsg.delete();
          }else{
            sentMsg.edit(`No stats on PUBG API yet, trying again...  _Take ${loopCount}_`);
            logger.log(`Stats not found yet, take ${loopCount}, seconds so far: ${timeInSec}`);
            loopCount++;
          }
        }, retryTimeInMs);
      }
    }else{
      logger.log(`No PUBG IDs found amoung winners, no stats`)
    }
  }catch(e){
    logger.error(e);
  }
}

module.exports = {
    autoStats
}