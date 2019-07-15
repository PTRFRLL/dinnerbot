const _ = require('lodash');
const score = require('./score');
const logger = require('./log');
const Discord = require('discord.js');
const app = require('../app');
const CONFIG = require('../config.js');
const {getImage, deleteFile} = require('./utils');
const utils = require('./db_utils.js')

const onMessage = async(message) => {
	//ignore bots
	if(message.author.bot) return;
	//if message was posted in the channel we want
  	if (message.channel.id === CONFIG.app.DISCORD_CHANNEL) {
  		//grab the first attachment (could be undefined)
	    let attachment = message.attachments.first();
	    //if there is an attachment
	    if(attachment){
	    	logger.log(`Attachment found from ${message.author.username}`);
			logger.log(`Filename: ${attachment.filename}`);
			if(attachment.filename.includes('.gif')){
				logger.log('GIF uploaded, skipping...');
				return;
			}
    		await checkScore(attachment.url, message);
	    }else if(message.content.includes('!wins')){
			//no attachment but we got !wins command
	    	logger.log(`Wins requested by ${message.author.username}`);
	    	let users = await getMessageUsers(message);
    		let wins = await utils.getWins(users);
    		let embed = formatDinnerCountResponse(wins, false);
			sendDiscordMessage(message, embed, false);
	    }else if(message.isMentioned(app.client.user)){
			if(CONFIG.app.AUTH_USERS.users.includes(message.author.id) || message.member.roles.some(r => CONFIG.app.AUTH_USERS.roles.includes(r.name))){
				//authorized user mentioned bot, meaning they want the win awarded regardless of score
				await awardManualWin(message);
			}else{
				let response = CONFIG.app.BOT_RESPONSES_BAD[Math.floor(Math.random()*CONFIG.app.BOT_RESPONSES_BAD.length)];
				message.channel.send(response);
			}
		}else{
	    	logger.log(`No attachment and no valid commands message from ${message.author.username}`);
	    	if(message.embeds.length > 0){
    			logger.log(`Embed detected, checking for URL`);
    			let got = message.embeds[0];
    			if(got.url){
    				logger.log(`URL detected, checking for wins`);
    				checkScore(got.url, message);
    			}
    		}
	    }
  	}
}

const awardManualWin = async(message) => {
	logger.log(`Received command to award win anyway`);
	let results = await utils.getLatestNonWin();
	if(results.length == 0){
		logger.log(`No non-win message found in DB`);
		message.channel.send(`I couldn't find any non-wins... :shrug:`);
		return;
	}
	let messageFromDB = results[0];
	let message_id = messageFromDB.message_id;
	let msg = await findMessageById(message_id);
	//calculate image hash
	let attachment = msg.attachments.first();
	if(attachment){
		let {hash, resizedPath} = await getImage(attachment.url);
		utils.recordHash(msg.id, hash, msg.author.username);
		deleteFile(resizedPath);
	}
	//get random response from dinnerbot
	let response = CONFIG.app.BOT_RESPONSES_GOOD[Math.floor(Math.random()*CONFIG.app.BOT_RESPONSES_GOOD.length)];
	message.channel.send(response);
	let users = getMessageUsers(msg);
	let res = await utils.logUserWins(users);
	let embed = formatDinnerCountResponse(res);
	sendDiscordMessage(message, embed, true);
	//remove non-win message from db
	utils.removeMessageFromDB(messageFromDB.id);
}

const checkScore = async(url, message) => {
	try{
		let imageProps = await getImage(url);
		const existingHash = await utils.checkImgHash(imageProps.hash);
		if(existingHash){
			logger.log(`Image hash found, not awarding win;`);
			message.reply(`Hey, I've seen this image before. Are you trying to game the system?`);
			deleteFile(imageProps.resizedPath);
			return;
		}
		let imgScore = await score.getScore(imageProps.resizedPath);
		let users = getMessageUsers(message);
		if(imgScore < CONFIG.app.IMG_SCORE_THRESHOLD && imgScore > 0){
			message.react('🍴');
	    	message.react('🐔');
			message.react('🏆');
	    	let res = await utils.logUserWins(users);
			let embed = formatDinnerCountResponse(res, imgScore);
			sendDiscordMessage(message, embed, true);
			logger.log(`Compare score looks good (${imgScore}), awarding win.`);
			utils.recordHash(message.id, imageProps.hash, message.author.username);
  		}else{
  			logger.log(`Compare score out of range (${imgScore}), no win for you!`);
  			await utils.logNonWin(message, imgScore);
  			if((imgScore - CONFIG.app.IMG_SCORE_THRESHOLD) < 5000){
	  			//if the score is CLOSE to the threshold, be slightly nicer
  				message.reply(`I see you uploaded an image but it doesn\'t look like a PUBG win to me...it's close though, did the screenshot capture something extra, like ShadowPlay or Discord?\n\n_Image compare score: ${imgScore.toLocaleString()}_`);
  			}else{
  				message.reply(`I see you uploaded an image but it doesn\'t look like a PUBG win to me...\n\n**NO WIN FOR YOU!** :clap:\n\n_Image compare score: ${imgScore.toLocaleString()}_`);
  			}
  		}
	}catch(err){
		logger.error('discord.js::Error in checkScore try block');
		logger.error(err);
	}
}

const getMessageUsers = (message) => {
	let users = [];
	let author = {
		username: message.author.username,
		id: message.author.id
	};
	users.push(author);

	let mentions = message.mentions.users.filter(user => {
		//exclude the bot if he's mentioned
		return user.id !== app.client.user.id;
	});
	mentions.forEach(user => {
		users.push({username: user.username, id: user.id});
	});
	//make array unique by ID (if author is tagged, remove dupe)
	users = _.uniqBy(users, 'id');
	logger.log(`Found the following users: ${users.map(user => user.username).join(', ')}`);
	return users;
}

const findMessageById = async(message_id) => {
	logger.debug(`Message ID: ${message_id}`);
	let channel = app.client.channels.get(CONFIG.app.DISCORD_CHANNEL);
	logger.debug(channel);
	return channel.fetchMessage(message_id);
}

const formatDinnerCountResponse = (users, score) => {
	let embed = new Discord.RichEmbed();
	embed.setTitle("Chicken Dinner Count [Beta]");
	embed.setDescription('PUBG wins counted by this bot for each tagged user.');
	embed.setColor('RANDOM');
	if(score) embed.setFooter(`Score: ${score.toLocaleString()}`);
	users.forEach(user => {
		if(!user.wins){
			embed.addField(user.username, 'N/A', true);
		}else{
			embed.addField(user.username, user.wins, true);
		}
	});
	return embed;
}

const sendDiscordMessage = (message, embed, isWinner) => {
	if(isWinner) message.channel.send('WINNER WINNER CHICKEN DINNER!');
	message.channel.send({embed});
}


let winners = [];
let spectators = [];
const presenceUpdate = async(old, updated) => {
	if(updated.presence.game != null && updated.presence.game.name === 'PLAYERUNKNOWN\'S BATTLEGROUNDS'){
		if(updated.presence.game.details == null) return;
		if(updated.presence.game.details.includes('Winner Winner Chicken Dinner!')){
			if(old.presence.game.details.includes('Watching')){
				logger.log(`Spectator win detected via presence for ${updated.user.username}, adding to spectators`);
				spectators.push(updated.user);
			}else if(!old.presence.game.details.includes('Winner Winner Chicken Dinner!')){
				logger.log(`Win detected via presence for ${updated.user.username}, adding to winners`);
				winners.push(updated.user);
			}else{
				logger.log(`Win detected for ${update.user.username} BUT old presence also a win, skipping add to array...`);
			}
		}
		if(old.presence.game.details != null && old.presence.game.details.includes('Winner Winner Chicken Dinner!') && !updated.presence.game.details.includes('Winner Winner Chicken Dinner!')){
			//players have left winner screen, send message
			logger.log(`Post win for ${old.user.username}: [${old.presence.game.details}] => [${updated.presence.game.details}]`);
			const channel = updated.guild.channels.get(CONFIG.app.DISCORD_CHANNEL);
			try{
				if(winners.length === 0) return;
				let response = CONFIG.app.BOT_PRESENCE_RESPONSES[Math.floor(Math.random()*CONFIG.app.BOT_PRESENCE_RESPONSES.length)];
				let winningUsers = winners.map(user => {
					return `<@${user.id}>`;
				});
				response = response.replace('[USER]', winningUsers.join(' '));
				channel.send(response); 
				//clear array
				winners.length = 0;
			}catch(e){
				logger.error(`Error sending winner presence response: ${e}`);
				//clear array
				winners.length = 0;
			}
			try{
				if(spectators.length === 0) return;
				let deadWinnersRes = CONFIG.app.BOT_SPECTATOR_RESPONSES[Math.floor(Math.random()*CONFIG.app.BOT_SPECTATOR_RESPONSES.length)];
				console.log(spectators);
				let spectatorUsers = spectators.map(user => {
					return `<@${user.id}>`;
				});
				deadWinnersRes = deadWinnersRes.replace('[USER]', spectatorUsers.join(' '));
				channel.send(deadWinnersRes);
				//clear array
				spectators.length = 0;
			}catch(e){
				logger.error(`Error sending spectator presence response: ${e}`);
				//clear array
				spectators.length = 0;
			}
			
		}	
    }
}


module.exports = {
	onMessage,
	presenceUpdate
};