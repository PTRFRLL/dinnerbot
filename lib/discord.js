const _ = require('lodash');
const db = require('./db');
const score = require('./score');
const logger = require('./log');
const Discord = require('discord.js');
const app = require('../app');
const CONFIG = require('../config.js');
module.exports.onMessage = onMessage;
module.exports.getWins = getWins;

async function onMessage(message){
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
    		await checkScore(attachment.url, message);
	    }else if(message.content.includes('!wins')){
			//no attachment but we got !wins command
	    	logger.log(`Wins requested by ${message.author.username}`);
	    	let users = await getMessageUsers(message);
    		let wins = await getWins(users);
    		let embed = formatDinnerCountResponse(wins, false);
			sendDiscordMessage(message, embed, false);
	    }else if(message.isMentioned(app.client.user)){
			if(CONFIG.app.AUTH_USERS.users.includes(message.author.id) || message.member.roles.some(r => CONFIG.app.AUTH_USERS.roles.includes(r.name))){
				//authorized user mentioned bot, meaning they want the win awarded regardless of score
				logger.log(`Received command to award win anyway`);
				let results = await getLatestNonWin();
				if(results.length == 0){
					logger.log(`No non-win message found in DB`);
					message.channel.send(`I couldn't find any non-wins... :shrug:`);
					return;
				}
				let messageFromDB = results[0];
				let message_id = messageFromDB.message_id;
				let msg = await findMessageById(message_id);
				//get random response from dinnerbot
				let response = CONFIG.app.BOT_RESPONSES_GOOD[Math.floor(Math.random()*CONFIG.app.BOT_RESPONSES_GOOD.length)];
				message.channel.send(response);
				let users = getMessageUsers(msg);
				let res = await logUserWins(message, users);
				let embed = formatDinnerCountResponse(res);
				sendDiscordMessage(message, embed, true);
				//remove non-win message from db
				removeMessageFromDB(messageFromDB.id);
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


async function checkScore(url, message){
	try{
		let imgScore = await score.getScore(url);
		let users = getMessageUsers(message);
		if(imgScore < CONFIG.app.IMG_SCORE_THRESHOLD && imgScore > 0){
			message.react('🍴');
	    	message.react('🐔');
			message.react('🏆');
	    	let res = await logUserWins(message, users);
			let embed = formatDinnerCountResponse(res, imgScore);
			sendDiscordMessage(message, embed, true);
			logger.log(`Compare score looks good (${imgScore}), awarding win.`);
  		}else{
  			logger.log(`Compare score out of range (${imgScore}), no win for you!`);
  			let res = await logNonWin(message, imgScore);
  			if((imgScore - CONFIG.app.IMG_SCORE_THRESHOLD) < 5000){
	  			//if the score is CLOSE to the threshold, be slightly nicer
  				message.reply(`I see you uploaded an image but it doesn\'t look like a PUBG win to me...it's close though, did the screenshot capture something extra, like ShadowPlay or Discord?\n\n_Image compare score: ${imgScore.toLocaleString()}_`);
  			}else{
  				message.reply(`I see you uploaded an image but it doesn\'t look like a PUBG win to me...\n\n**NO WIN FOR YOU!** :clap:\n\n_Image compare score: ${imgScore.toLocaleString()}_`);
  			}
  		}
	}catch(err){
		logger.error('app.js::Error in checkScore try block');
		logger.error(err);
	}
}

function getMessageUsers(message){
	let users = [];
	let author = {
		username: message.author.username,
		id: message.author.id
	};
	users.push(author);

	let mentions = message.mentions.users;
	mentions.forEach(user => {
		users.push({username: user.username, id: user.id});
	});
	//make array unique by ID (if author is tagged, remove dupe)
	users = _.uniqBy(users, 'id');
	logger.log(`Found the following users`);
	console.log(users);
	return users;
}



function formatDinnerCountResponse(users, score){
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

function sendDiscordMessage(message, embed, isWinner){
	if(isWinner) message.channel.send('WINNER WINNER CHICKEN DINNER!');
	message.channel.send({embed});
}

async function getWins(users){
	return await Promise.all(users.map(async (messageUser) => {
		let user = await db.user.findOne({
			where: {
				discord_id: messageUser.id
			}
		});
		if(user){
			return user;
		}else{
			logger.log(`User not found`);
			return {username: messageUser.username, wins: undefined};
		}
	}));
}



async function logUserWins(message, users){
	return await Promise.all(users.map(async (messageUser) => {
		let user = await db.user.findOne({
			where: {
				discord_id: messageUser.id
			}
		});
		if(user){
			let updatedUser = await user.increment('wins');
			logger.log(`${messageUser.username} found, incrementing wins...`);
			return updatedUser.reload();
		}else{
			logger.log(`${messageUser.username} was not found, creating user...`);
			return await db.user.create({
				username: messageUser.username,
				discord_id: messageUser.id,
				wins: 1
			});
		}
	}));
}


async function logNonWin(message, score){
	logger.log(`Non win added to database`);
	return await db.message.create({
		message_id: message.id,
		score: score
	});
}

async function getLatestNonWin(){
	return await db.message.findAll({
		limit: 1,
		order: [['createdAt', 'DESC']],
		raw: true
	});
}

async function removeMessageFromDB(id){
	try{
		logger.log(`Removed non-win message with ${id}`)
		return !!await db.message.destroy({
			where: {
				id: id
			}
		});
	}catch(e){
		logger.debug(`Error removing message from DB`);
		return false;
	}
}

async function findMessageById(message_id){
	logger.debug(`Message ID: ${message_id}`);
	let channel = app.client.channels.get(CONFIG.app.DISCORD_CHANNEL);
	logger.debug(channel);
	return channel.fetchMessage(message_id);
}