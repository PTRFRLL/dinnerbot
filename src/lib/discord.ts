import {Message, MessageEmbed} from 'discord.js';
import { User } from '../types';
import logger from './logger';
import {getTimestamp, SIMPLE_DATE_FORMAT} from './timestamp';

/**
 * Send Winner Winner response to a found win and increment wins
 * @param {*} message - Discord message of win
 * @param {*} users - list of users to add win to
 * @param {*} filePath - filepath of image
 * @param {*} score - image comparison score
 */
export const winnerWinner = async(message: Message, users: Array<User>, filePath: string, score: number) => {
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

/**
 * Gets list of users mentioned in a Discord message
 * @param {*} message - Discord message
 * @param {*} includeAuthor - should list include author of message
 * @returns - array of users found in message
 */
export const getMessageUsers = (message: Message, includeAuthor: boolean = true) => {
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
    logger.log(`Found the following users: ${usersList.map(user => user.username).join(', ')}`);
    return usersList;
}

/**
 * Creates MessageEmbed containing winners and their win count
 * @param {*} users - list of users to add to embed
 * @param {*} score - image comparison score
 * @returns
 */
export const formatDinnerCountResponse = (users: Array<User>, score?: number) => {
    let embed = new MessageEmbed();
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
export const createStatsEmbed = async(stats, username: string) => {
    let embed = new MessageEmbed();
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
export const createWinningStatEmbed = async(stats, username: string, displayTeam: boolean = false) => {
    let embed = new MessageEmbed();
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
export const sendDiscordMessage = (message: Message, embed: MessageEmbed, isWinner: boolean) => {
    if (isWinner) message.channel.send("WINNER WINNER CHICKEN DINNER!");
    message.channel.send({ embed });
}

/**
 * Gets users wins and sends embed message
 * @param {*} users 
 * @param {*} message 
 */
export const sendWins = async(users: Array<User>, message: Message) => {
    let wins = await db.getWins(users);
    let embed = formatDinnerCountResponse(wins);
    sendDiscordMessage(message, embed, false);
}

/**
 * Determines if user is authorized user
 * @param {*} message 
 * @returns 
 */
export const isAuth = (message: Message) => {
    try{
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

/**
 * Responds to unauthorized user
 * @param {*} message 
 */
export const notAuthResponse = async(message: Message) => {
    await message.react('🖕');
    let response =
      CONFIG.app.BOT_RESPONSES_BAD[
        Math.floor(Math.random() * CONFIG.app.BOT_RESPONSES_BAD.length)
      ];
    message.channel.send(response);
}

/**
 * Calculates match MVP 
 * @param {*} stats 
 * @param {*} name 
 * @returns 
 */
export const determineMVP = (stats, name: string) => {
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