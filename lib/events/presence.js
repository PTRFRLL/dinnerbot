const logger = require('../log')('events/presence');
const {RESPONSES, VALID_MAPS, PUBG_APP_ID} = require('../constants');
const {autoStats} = require('../stats');
const {hashText} = require('../utils');

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
    if(!activities) return;

    const {newPresence, oldPresence} = activities;

    if(!newPresence.details || !oldPresence.details) return;

    const match = {
      user: updated.user,
      old: oldPresence,
      updated: newPresence
    }
    //new presence is a win...
    if (newPresence.details.includes(WINNER_WINNER)) {
      logger.debug(`PUBG presence found: ${JSON.stringify(newPresence)}`);
      detectWin(match);
    }
    //players have left winner screen, send message
    else if (oldPresence.details.includes(WINNER_WINNER) && !newPresence.details.includes(WINNER_WINNER)) {
      logger.debug(`PUBG presence found: ${JSON.stringify(newPresence)}`);
      const channel = updated.guild.channels.cache.get(process.env.CHANNEL_ID);
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
    return null;
  }
  return {
    oldPresence,
    newPresence
  }
};


/**
 * Detect and save winners based on presence
 * @param {*} match 
 * @returns 
 */
const detectWin = (match) => {
  const {user, old, updated} = match;
  logger.info(`Win detected by presence, pre-exclude: ${updated.details}`);
  if(!isValidMap(updated.details)){
    return;
  }
  let isDead = false;
  let shouldSave = false;
  //check if alive or spectator
  if(old.details.includes("Watching")){
    logger.info(`Spectator win detected via presence for ${user.username}, adding to spectators`);
    isDead = true;
    shouldSave = true;
  }else if(!old.details.includes(WINNER_WINNER)){
    //presense gets updated to 'winner winner...' twice, so check this is the first time
    logger.info(`Win detected via presence for ${user.username}, adding to winners`);
    shouldSave = true;
  }else {
    logger.info(`Win detected for ${user.username} BUT old presence also a win, skipping add to array...`);
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
  const id = generateMatchHash(updated);
  logger.debug(`Party id: ${id}`);
  if(WINNERS.has(id)){
    logger.info(`${id} found in map, adding to team`)
    let arr = WINNERS.get(id);
    arr.push(winner);
  }else{
    logger.info(`Not found in winners map, adding ${id}`)
    WINNERS.set(id, [winner]);
  }
}

/**
 * Creates unique identifier of match from presence object
 * @param {*} presence 
 * @returns SHA1 hash
 */
const generateMatchHash = (presence) => {
  let details = presence.details;
  let state = presence.state;
  let partySize = presence.party.size.join();
  const combined = details + state + partySize;
  return hashText(combined)
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
  logger.info(`Ignoring mode [${winningMode[1]}] split from ${details}`);
  return false;
}

/**
 * Send message to winners
 * @param {*} match 
 * @param {*} channel 
 * @returns 
 */
const handleWin = async(match, channel) => {
  const {user, old, updated} = match;
  if(!isValidMap(old.details)){
    return;
  }
  logger.info(`Post win for ${user.username}: [${old.details}] => [${updated.details}]`);
  const id = generateMatchHash(old);
  logger.debug(`Found party ID: ${id}`);
  if(!WINNERS.has(id)){
    logger.info(`Winners ID ${id} not found, message must have been sent already...`);
    return;
  }
  logger.debug(`Winners map: ${WINNERS}`)
  let players = [...WINNERS.get(id)];
  logger.debug(`Found ${players.length} players in party`)

  //remove so we don't get duplicate response(s)
  WINNERS.delete(id);

  if(players.length === 0) return;

  const {alive, spectators} = separateAliveAndSpectators(players);

  await sendMessage(alive, channel);

  if(spectators.length > 0){
    await sendMessage(spectators, channel, true);
  }

  const partyId = updated.party.id;
  sendStats(players, channel, partyId);
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
const sendStats = async(players, channel, partyId) => {
  if(process.env.PUBG_API_KEY && process.env.PUBG_API_KEY !== ''){
    let presenceId = extractPUBGIdFromPartyId(partyId);
    await autoStats(players, channel, presenceId);
  }else{
    logger.debug('PUBG API key missing, auto stats skipped')
  }
}

const extractPUBGIdFromPartyId = (partyId) => {
  if(partyId.includes('account') && partyId.includes('-')){
    let ID = partyId.split('-').shift();
    logger.debug(`Extracted ${ID} from party Id`);
    return ID;
  }
  return null;
}

module.exports = {
    presenceUpdate
};