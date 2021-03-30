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
      await wait(CONFIG.app.STAT_WAIT_TIME);
      let stats = await pubg.getLatestWin(user.pubg_id);
      if(stats){
        if(isRecentWin(stats.date)){
          logger.debug(`Recent stats found, sending message`);
          await sendWinningStats(stats, user, channel, sentMsg);
        }else{
          logger.log(`Stats found but not recent enough, stat date is ${moment(stats.date).format('YYYY-MM-DD HH:mm:ss')}, trying again...`);
          let timeInSec = CONFIG.app.STAT_WAIT_TIME / 1000; //get timeout ms in seconds
          let loopCount = 1;
          sentMsg.edit(`No stats on PUBG API yet, trying again...  _Take ${loopCount}_`);
          let timelimit = CONFIG.app.STAT_RETRY_ABANDON_AFTER_SECONDS || 300;
          logger.debug(`Abandon stat lookup after ${timelimit} seconds`);
          let interval = setInterval(async () => {
            timeInSec += CONFIG.app.STAT_RETRY_TIME / 1000;
            let statsAgain = await pubg.getLatestWin(user.pubg_id);
            if(!statsAgain){
              logger.error(`No stats returned from re-attempt`);
            }
            else if(isRecentWin(statsAgain.date)){
              clearInterval(interval);
              logger.log(`Found stats after ${timeInSec} seconds`);
              await sendWinningStats(statsAgain, user, channel, sentMsg);
            }else if(timeInSec >= timelimit){
              clearInterval(interval);
              logger.log(`Stats still not found after ${timeInSec} seconds`);
              sentMsg.delete();
            }else{
              sentMsg.edit(`No stats on PUBG API yet, trying again...  _Take ${loopCount}_`);
              logger.log(`Stats not found yet, take ${loopCount}, seconds so far: ${timeInSec}`);
              loopCount++;
            }
          }, CONFIG.app.STAT_RETRY_TIME);
        }
      }else{
        logger.log(`No stats returned from PUBG API`)
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