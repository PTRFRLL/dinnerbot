const logger = require('../log');
let CONFIG;
if(process.env.NODE_ENV === 'DOCKER'){
	CONFIG = require('/config/config');
}else{
	CONFIG = require('../../config');
}
const {RESPONSES, VALID_MAPS, PUBG_APP_ID} = require('../constants');
const {autoStats} = require('../stats');

const WINNERS = new Map();

const WINNER_WINNER = "Winner Winner Chicken Dinner!";

/**
 * Event handler for presenceUpdate
 * @param {*} old old presence 
 * @param {*} updated new presence 
 * @returns 
 */
const presenceUpdate = async(old, updated) => {
  try{
    const activities = getPUBGPresence(old, updated);
    if(!activities?.newPresence || !activities?.oldPresence) return;

    const {newPresence, oldPresence} = activities;

    logger.debug(`PUBG presence found: ${JSON.stringify(newPresence)}`);

    const match = {
      user: updated.user,
      old: oldPresence,
      updated: newPresence
    }
    //new presence is a win...
    if (newPresence.details.includes(WINNER_WINNER)) {
      detectWin(match);
    }
    //players have left winner screen, send message
    else if (oldPresence.details.includes(WINNER_WINNER) && !newPresence.details.includes(WINNER_WINNER)) {
      const channel = updated.guild.channels.cache.get(CONFIG.app.DISCORD_CHANNEL);
      await handleWin(match, channel);
    }
  }catch(e){
    logger.error(`Error in presenceUpdate`)
    logger.error(e);
  }
}

/**
 * Get PUBG activities from presence objects
 * @param {*} old old presence
 * @param {*} updated new presence
 * @returns PUBG Activities | null
 */
const getPUBGPresence = (old, updated) => {
  const oldActivities = old?.activities;
  const newActivities = updated?.activities;
  if(!newActivities || !oldActivities){
    return null;
  }
  const oldPresence = oldActivities.find(act => act.applicationID === PUBG_APP_ID);
  const newPresence = newActivities.find(act => act.applicationID === PUBG_APP_ID);
  if(!oldPresence || !newPresence){
    logger.debug('No PUBG activities found');
    return null;
  }
  return {
    oldPresence,
    newPresence
  }
};


/**
 * Detect and save winners based on presence
 * @param {*} presence 
 * @returns 
 */
const detectWin = (presence) => {
  const {user, old, updated} = presence;
  logger.log(`Win detected by presence, pre-exclude: ${updated.details}`);
  if(!isValidMap(updated.details)){
    return;
  }
  let isDead = false;
  let shouldSave = false;
  //check if alive or spectator
  if(old.details.includes("Watching")){
    logger.log(`Spectator win detected via presence for ${user.username}, adding to spectators`);
    isDead = true;
    shouldSave = true;
  }else if(!old.details.includes(WINNER_WINNER)){
    //presense gets updated to 'winner winner...' twice, so check this is the first time
    logger.log(`Win detected via presence for ${user.username}, adding to winners`);
    shouldSave = true;
  }else {
    logger.log(`Win detected for ${user.username} BUT old presence also a win, skipping add to array...`);
  }
  if(shouldSave){
    let winner = {
      user,
      isDead,
      timestamp: + new Date()
    };
    saveWinner(updated, winner)
  }
}

/**
 * Save winner to WINNERS Map
 * @param {*} updated new presence
 * @param {*} winner found winner
 */
const saveWinner = async(updated, winner) => {
  const id = updated.party.id;
  if(WINNERS.has(id)){
    let arr = WINNERS.get(id);
    arr.push(winner);
  }else{
    WINNERS.set(id, [winner]);
  }
}

/**
 * Check if presence is for a valid map
 * @param {*} details 
 * @returns true if valid otherwise false
 */
const isValidMap = (details) => {
  const winningMode = details.split(', ');
  if(winningMode.length > 1 && VALID_MAPS.includes(winningMode[1])){
    return true;
  }
  logger.log(`Ignoring mode [${winningMode[1]}] split from ${details}`);
  return false;
}

/**
 * Send message to winners
 * @param {*} presence 
 * @param {*} channel 
 * @returns 
 */
const handleWin = async(presence, channel) => {
  const {user, old, updated} = presence; 
  logger.log(`Post win for ${user.username}: [${old.details}] => [${updated.details}]`);
  const id = updated.party.id;
  if(!WINNERS.has(id)){
    logger.log(`Winners ID ${id} not found, message must have been sent already...`);
    return;
  }
  let players = [...WINNERS.get(id)];

  //remove so we don't get duplicate response(s)
  WINNERS.delete(id);

  if(players.length === 0) return;

  const {alive, spectators} = separateAliveAndSpectators(players);

  await sendMessage(alive, channel);

  if(spectators.length > 0){
    await sendMessage(spectators, channel, true);
  }

  sendStats(players, channel);
}

/**
 * Separates winners/spectators from winners list
 * @param {*} players 
 * @returns two arrays, alive, spectators
 */
const separateAliveAndSpectators = (players) => {
  const checkDate = new Date(Date.now() - 5000 * 60).getTime();
  const alive = players.filter(player => {
    return !player.isDead && player.timestamp > checkDate
  }).map(player => {
    return `<@${player.user.id}>`
  });
  const spectators = players.filter(player => {
    return player.isDead && player.timestamp > checkDate
  }).map(player => {
    return `<@${player.user.id}>`
  });
  return {
    alive,
    spectators
  }
}

/**
 * Sends message to given array of users
 * @param {*} array user list
 * @param {*} channel channel to send message to
 * @param {*} spectator player list is spectators
 */
const sendMessage = async(array, channel, spectator = false) => {
  let response = getRandomResponse(spectator);
  response = response.replace("[USER]", array.join(" "));
  await channel.send(response);
}

/**
 * Gets random response for bot
 * @param {*} spectator load from spectators responses
 * @returns random response
 */
const getRandomResponse = (spectator) => {
  if(spectator){
    return RESPONSES.SPECTATOR[
      Math.floor(Math.random() * RESPONSES.SPECTATOR.length)
    ];
  }
  return RESPONSES.WINNER[
    Math.floor(Math.random() * RESPONSES.WINNER.length)
  ];
}

/**
 * Conditionally send stats to winners
 * @param {*} players 
 * @param {*} channel 
 */
const sendStats = async(players, channel) => {
  if(CONFIG.services.PUBG_API_KEY && CONFIG.services.PUBG_API_KEY !== ''){
    await autoStats(players, channel);
  }else{
    logger.debug('PUBG API key missing, auto stats skipped')
  }
}

module.exports = {
    presenceUpdate
};