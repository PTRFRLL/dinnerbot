const Discord = require("discord.js");
const logger = require("./log")('discord');
const app = require("../app");
const {deleteFile} = require('./utils');
const { getTimestamp, SIMPLE_DATE_FORMAT } = require('./timestamp');
const db = require('./db_utils');
const {RESPONSES} = require('./constants');


/**
 * Send Winner Winner response to a found win and increment wins
 * @param {*} message - Discord message of win
 * @param {*} users - list of users to add win to
 * @param {*} filePath - filepath of image
 * @param {*} score - image comparison score
 */
const winnerWinner = async(message, users, filePath, score) => {
  try{
    message.react("🍴");
    message.react("🐔");
    message.react("🏆");
    let res = await db.logUserWins(users);
    let embed = formatDinnerCountResponse(res, score);
    await sendDiscordMessage(message, embed, true);
  }catch(e){
    logger.error(e);
  }
}

/**
 * Gets list of users mentioned in a Discord message
 * @param {*} message - Discord message
 * @param {*} includeAuthor - should list include author of message
 * @returns - array of users found in message
 */
const getMessageUsers = (message, includeAuthor = true) => {
  let users = new Map();
  if(includeAuthor){
    let author = {
      username: message.author.username,
      id: message.author.id
    };
    users.set(author.id, author);
  }
  
  let mentions = message.mentions.users.filter(user => {
		//remove dinner-bot, if he got tagged
		return user.id !== app.client.user.id;
	});
  mentions.forEach(user => {
    users.set(user.id, { username: user.username, id: user.id })
  });
  //convert map to array
  let usersList = Array.from(users, ([name, value]) => {
    return value;
  })
  logger.info(`Found the following users: ${usersList.map(user => user.username).join(', ')}`);
  return usersList;
}



/**
 * Creates MessageEmbed containing winners and their win count
 * @param {*} users - list of users to add to embed
 * @param {*} score - image comparison score
 * @returns
 */
const formatDinnerCountResponse = (users, score) => {
  let embed = new Discord.MessageEmbed();
  embed.setTitle("Chicken Dinner Count");
  embed.setDescription("PUBG wins counted by this bot for each tagged user.");
  embed.setColor("RANDOM");
  if (score) embed.setFooter(`Score: ${score.toLocaleString()}`);
  users.forEach(user => {
    if (!user.wins) {
      embed.addField(user.username, "N/A", true);
    } else {
      embed.addField(user.username, user.wins, true);
    }
  });
  return embed;
}

/**
 * Creates MessageEmbed containing user and their requested stats
 * @param {*} stats - object of stats
 * @param {*} username
 * @returns 
 */
const createStatsEmbed = async(stats, username) => {
  let embed = new Discord.MessageEmbed();
  embed.setTitle(`Lifetime PUBG Stats`);
  embed.setColor('RANDOM');
  embed.setDescription(`PUBG User: ${username}`);
  const canInline = stats.length > 1;
  for(let stat of stats){
    embed.addField(stat.name, stat.value, canInline);
  }
  embed.setFooter(`*All distances in meters. Stats Queried: ${getTimestamp(SIMPLE_DATE_FORMAT)}`)
  return embed;
};

/**
 * Creates MessageEmbed containing PUBG stats from last win
 * @param {*} stats 
 * @param {*} username 
 * @param {*} displayTeam 
 * @returns 
 */
const createWinningStatEmbed = async(stats, displayTeam = false) => {
  let username = stats.name;
  let embed = new Discord.MessageEmbed();
  embed.setTitle(`PUBG Stats`);
  embed.setColor('RANDOM');
  embed.setURL(`https://pubglookup.com/players/steam/${username}/matches/${stats.matchId}`);
  if(displayTeam){
    embed.setDescription(`Last winning match stats for ${username} & co.`);
    embed.addField('Team', `${username}, ${stats.team.map(x => x.name).join(', ')}`, false);
    embed.addField('Mode', stats.mode ,true);
    embed.addField('Map', stats.map ,true);
    let kills = stats.kills + stats.team.reduce((x, b) => {
      return x + b.kills;
    }, 0);
    let damage = stats.damageDealt + stats.team.reduce((x, b) => {
      return x + b.damageDealt;
    }, 0);
    let headshots = stats.headshotKills + stats.team.reduce((x, b) => {
      return x + b.headshotKills;
    }, 0);
    let DBNOs = stats.DBNOs + stats.team.reduce((x, b) => {
      return x + b.DBNOs;
    }, 0);
    embed.addField('Kills', kills, true);
    embed.addField('Headshot Kills', headshots, true);
    embed.addField('Damage', Math.round(damage).toLocaleString(), true);
    embed.addField('DBNOs', DBNOs, true);

    const mvp = determineMVP(stats, username);
    embed.addField('MVP 🏆', `${mvp.name}: ${mvp.kills} kills, ${Math.round(mvp.damageDealt)} damage`, false);
  }else{
    embed.setDescription(`Last winning match stats for ${username}`);
    embed.addField('Mode', stats.mode ,true);
    embed.addField('Map', stats.map ,true);
    embed.addField('Kills', stats.kills ,true);
    embed.addField('Time Survived', stats.timeSurvived, true);
    if(stats.team.length > 0){
      embed.addField('Teammates', stats.team.map(x => x.name).join(', '), true);
    }
  }
  embed.setFooter(`Played: ${getTimestamp(SIMPLE_DATE_FORMAT)}`)
  return embed;
};

/**
 * Sends embed message to Discord channel
 * @param {*} message 
 * @param {*} embed 
 * @param {*} isWinner 
 */
const sendDiscordMessage = (message, embed, isWinner) => {
  if (isWinner) message.channel.send("WINNER WINNER CHICKEN DINNER!");
  return message.channel.send({ embed });
}

/**
 * Gets users wins and sends embed message
 * @param {*} users 
 * @param {*} message 
 */
const sendWins = async(users, message) => {
  let wins = await db.getWins(users);
  let embed = formatDinnerCountResponse(wins, false);
  sendDiscordMessage(message, embed, false);
}

/**
 * Determines if user is authorized user
 * @param {*} message 
 * @returns 
 */
const isAuth = (message) => {
  try{
    let ROLES = getListFromEnvVar(process.env.AUTH_ROLES);
    let USERS = getListFromEnvVar(process.env.AUTH_USERS);
    logger.debug(`AUTH_USERS: ${USERS}`);
    logger.debug(`AUTH_ROLES: ${ROLES}`);
    if(USERS){
      if (USERS.includes(message.author.id)) {
        return true;
      }
    }
    if(ROLES){
      if(message.member.roles.cache.some(r => ROLES.includes(r.name))){
        return true;
      }
    }
    return false;
  }catch(e){
    logger.error(e);
    return false;
  }
}

const getListFromEnvVar = (envVar) => {
  if(envVar.length == 0){
    return null;
  }
  return envVar.split(',').map(str => str.trim());
}

/**
 * Responds to unauthorized user
 * @param {*} message 
 */
const notAuthResponse = async(message) => {
  await message.react('🖕');
  let response =
    RESPONSES.UNAUTHED[
      Math.floor(Math.random() * RESPONSES.UNAUTHED.length)
    ];
  message.channel.send(response);
}

/**
 * Calculates match MVP 
 * @param {*} stats 
 * @param {*} name 
 * @returns 
 */
 const determineMVP = (stats, name) => {
  const { survivalTime, damageDealt, kills } = stats;
  const player = {survivalTime, name, damageDealt, kills};
  
  const players = stats.team.map(t => {
    return {damageDealt: t.damageDealt, name: t.name, survivalTime: t.survivalTime, kills: t.kills}
  });
  players.push(player);

  //start with survival time, cause they won it if they lasted the longest
  const longestSurvivalTime = Math.max(...players.map(p => p.survivalTime));

  const survivors = players.filter(p => p.survivalTime === longestSurvivalTime);
  if(survivors.length === 1){
    return survivors[0];
  }
  
  //damage dealt
  return players.sort((a,b) => {
    return b.damageDealt - a.damageDealt;
  }).shift();
};

module.exports = {
  winnerWinner,
  sendDiscordMessage,
  formatDinnerCountResponse,
  getMessageUsers,
  sendWins,
  createStatsEmbed,
  isAuth,
  notAuthResponse,
  createWinningStatEmbed
};