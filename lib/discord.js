const _ = require("lodash");
const logger = require("./log");
const Discord = require("discord.js");
const app = require("../app");
let CONFIG;
if(process.env.NODE_ENV === 'DOCKER'){
	CONFIG = require('/config/config');
}else{
	CONFIG = require('../config');
}
const {deleteFile } = require('./utils.js');
const db = require('./db_utils');
const moment = require('moment');

const winnerWinner = async(message, users, filePath, score) => {
  try{
    message.react("🍴");
    message.react("🐔");
    message.react("🏆");
    let res = await db.logUserWins(users);
    let embed = formatDinnerCountResponse(res, score);
    sendDiscordMessage(message, embed, true);
    deleteFile(filePath);
  }catch(e){
    logger.error(e);
  }
}


const getMessageUsers = (message, includeAuthor = true) => {
  let users = [];
  if(includeAuthor){
    let author = {
      username: message.author.username,
      id: message.author.id
    };
    users.push(author);
  }
  
  let mentions = message.mentions.users.filter(user => {
		//remove dinner-bot, if he got tagged
		return user.id !== app.client.user.id;
	});
  mentions.forEach(user => {
    users.push({ username: user.username, id: user.id });
  });
  //make array unique by ID (if author is tagged, remove dupe)
  users = _.uniqBy(users, "id");
  logger.log(`Found the following users: ${users.map(user => user.username).join(', ')}`);
  return users;
}

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

const createStatsEmbed = async(stats, username) => {
  let embed = new Discord.MessageEmbed();
  embed.setTitle(`Lifetime PUBG Stats`);
  embed.setColor('RANDOM');
  embed.setDescription(`PUBG User: ${username}`);
  const canInline = stats.length > 1;
  for(let stat of stats){
    embed.addField(stat.name, stat.value, canInline);
  }
  embed.setFooter(`*All distances in meters. Stats Queried: ${moment().format('MMM D h:mmA')}`)
  return embed;
};

const createWinningStatEmbed = async(res, username, displayTeam = false) => {
  let embed = new Discord.MessageEmbed();
  embed.setTitle(`PUBG Stats`);
  embed.setColor('RANDOM');
  embed.setURL(`https://pubglookup.com/players/steam/${username}/matches/${res.matchId}`);
  if(displayTeam){
    embed.setDescription(`Last winning match stats for ${username} & co.`);
    embed.addField('Team', `${username}, ${res.team.map(x => x.name).join(', ')}`, false);
    embed.addField('Mode', res.mode ,true);
    embed.addField('Map', res.map ,true);
    let kills = res.kills + res.team.reduce((x, b) => {
      return x + b.kills;
    }, 0);
    let damage = res.damageDealt + res.team.reduce((x, b) => {
      return x + b.damageDealt;
    }, 0);
    // let revives = res.revives + res.team.reduce((x, b) => {
    //   return x + b.revives;
    // }, 0);
    let headshots = res.headshotKills + res.team.reduce((x, b) => {
      return x + b.headshotKills;
    }, 0);
    let DBNOs = res.DBNOs + res.team.reduce((x, b) => {
      return x + b.DBNOs;
    }, 0);
    embed.addField('Kills', kills, true);
    embed.addField('Headshot Kills', headshots, true);
    embed.addField('Damage', Math.round(damage).toLocaleString(), true);
    embed.addField('DBNOs', DBNOs, true);

    const mvp = determineMVP(res, username);
    embed.addField('MVP 🏆', `${mvp.name}: ${mvp.kills} kills, ${Math.round(mvp.damageDealt)} damage`, false);
  }else{
    embed.setDescription(`Last winning match stats for ${username}`);
    embed.addField('Mode', res.mode ,true);
    embed.addField('Map', res.map ,true);
    embed.addField('Kills', res.kills ,true);
    embed.addField('Time Survived', res.timeSurvived, true);
    if(res.team.length > 0){
      embed.addField('Teammates', res.team.map(x => x.name).join(', '), true);
    }
  }
  embed.setFooter(`Played: ${moment(res.date).format('MMM D h:mmA')}`)
  return embed;
};

const sendDiscordMessage = (message, embed, isWinner) => {
  if (isWinner) message.channel.send("WINNER WINNER CHICKEN DINNER!");
  message.channel.send({ embed });
}


const findMessageById = async(message_id) => {
  logger.debug(`Message ID: ${message_id}`);
  let channel = app.client.channels.get(CONFIG.app.DISCORD_CHANNEL);
  logger.debug(channel);
  return channel.fetchMessage(message_id);
}

const sendWins = async(users, message) => {
  let wins = await db.getWins(users);
  let embed = formatDinnerCountResponse(wins, false);
  sendDiscordMessage(message, embed, false);
}

const isAuth = (message) => {
  try{
    console.log('CONFIG', CONFIG.app.AUTH_USERS.users)
    if (
      CONFIG.app.AUTH_USERS.users.includes(message.author.id) ||
      message.member.roles.cache.some(r => CONFIG.app.AUTH_USERS.roles.includes(r.name))
    ) {
      return true;
    } else {
      return false
    }
  }catch(e){
    logger.error(e);
    return false;
  }
}

const notAuthResponse = async(message) => {
  await message.react('🖕');
  let response =
    CONFIG.app.BOT_RESPONSES_BAD[
      Math.floor(Math.random() * CONFIG.app.BOT_RESPONSES_BAD.length)
    ];
  message.channel.send(response);
}

module.exports = {
  winnerWinner,
  findMessageById,
  sendDiscordMessage,
  formatDinnerCountResponse,
  getMessageUsers,
  sendWins,
  createStatsEmbed,
  isAuth,
  notAuthResponse,
  createWinningStatEmbed
};