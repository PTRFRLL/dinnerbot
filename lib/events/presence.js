const logger = require('../log');
let CONFIG;
if(process.env.NODE_ENV === 'DOCKER'){
	CONFIG = require('/config/config');
}else{
	CONFIG = require('../../config');
}
const {autoStats} = require('../stats');

let winners = [];

const getPUBGPresence = (old, updated) => {
  const PUBG_ID = "530196305138417685";
  const oldActivities = old?.activities;
  const newActivities = updated?.activities;
  if(!newActivities || oldActivities){
    return null;
  }
  const oldPresence = oldActivities.find(act => act.applicationID === PUBG_ID);
  const newPresence = newActivities.find(act => act.applicationID === PUBG_ID);
  if(!oldPresence || !newPresence){
    logger.debug('No PUBG activities found');
    return null;
  }
  return {
    oldPresence,
    newPresence
  }
};


const presenceUpdate = async(old, updated) => {
  try{
    const {newPresence, oldPresence } = getPUBGPresence(old, updated);
    if(!newPresence || !oldPresence) return;

    logger.debug(`PUBG presence found: ${JSON.stringify(newPresence)}`);

    const match = {
      user: updated.user,
      old: oldPresence,
      updated: newPresence
    }
    //new presence is a win...
    if (newPresence.details.includes("Winner Winner Chicken Dinner!")) {
      detectWin(match);
    }
    //players have left winner screen, send message
    if (oldPresence.details.includes("Winner Winner Chicken Dinner!") && !newPresence.details.includes("Winner Winner Chicken Dinner!")) {
      const channel = updated.guild.channels.cache.get(CONFIG.app.DISCORD_CHANNEL);
      handleWin(match, channel);
    }
  }catch(e){
    logger.error(`Discord.js: Error in presenceUpdate`)
    logger.error(e);
  }
}

const isValidMap = (details) => {
  const VALID_MAPS = ['Sanhok', 'Vikendi', 'Erangel', 'Miramar', 'Karakin', 'Erangel (Remastered)', 'Paramo'];
  let winningMode = details.split(', ');
  if(winningMode.length > 1 && VALID_MAPS.includes(winningMode[1])){
    return true;
  }
  logger.log(`Ignoring mode [${winningMode[1]}] split from ${details}`);
  return false;
}

const detectWin = async(match) => {
  const {user, old, updated} = match;
  logger.log(`Win detected by presence, pre-exclude: ${updated.details}`);
  if(!isValidMap(updated.details)){
    return;
  }
  //check if alive or spectator
  if(old.details.includes("Watching")){
    logger.log(`Spectator win detected via presence for ${user.username}, adding to spectators`);
    winners.push({
      user: user,
      timestamp: + new Date(),
      isDead: true
    });
  }else if(!oldDetails.includes("Winner Winner Chicken Dinner!")){
    //presense gets updated to 'winner winner...' twice, so check this is the first time
    logger.log(`Win detected via presence for ${user.username}, adding to winners`);
    winners.push({
      user: user,
      timestamp: + new Date(),
      isDead: false
    });
  }else {
    logger.log(`Win detected for ${user.username} BUT old presence also a win, skipping add to array...`);
  }
}

const handleWin = async(match, channel) => {
  const {user, old, updated} = match; 
  logger.log(`Post win for ${user.username}: [${old.details}] => [${updated.details}]`);
  let checkDate = new Date(Date.now() - 5000 * 60).getTime();
  if(winners.length === 0) return;
  let alive = winners.filter(player => {
    return !player.isDead && player.timestamp > checkDate
  }).map(player => {
    return `<@${player.user.id}>`
  });
  let spectators = winners.filter(player => {
    return player.isDead && player.timestamp > checkDate
  }).map(player => {
    return `<@${player.user.id}>`
  });
  let response =
    CONFIG.app.BOT_PRESENCE_RESPONSES[
      Math.floor(Math.random() * CONFIG.app.BOT_PRESENCE_RESPONSES.length)
    ];
  response = response.replace("[USER]", alive.join(" "));
  await channel.send(response);

  if(spectators.length > 0){
    let response =
          CONFIG.app.BOT_SPECTATOR_RESPONSES[
            Math.floor(
              Math.random() * CONFIG.app.BOT_SPECTATOR_RESPONSES.length
            )
          ];
    response = response.replace("[USER]", spectators.join(" "));
    await channel.send(response);
  }
  sendStats();
  winners.length = 0;
}

const sendStats = async() => {
  if(CONFIG.services.PUBG_API_KEY && CONFIG.services.PUBG_API_KEY !== ''){
    await autoStats(winners, channel);
  }
}

module.exports = {
    presenceUpdate
};