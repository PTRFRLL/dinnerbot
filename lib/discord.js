require('dotenv').config();
const _ = require('lodash');
const db = require('./db');
const score = require('./score');
const logger = require('./log');
const Discord = require('discord.js');

module.exports.onMessage = onMessage;
module.exports.getWins = getWins;

async function onMessage(message){
	//ignore bots
	if(message.author.bot) return;
	//if message was posted in the channel we want
  	if (message.channel.id === process.env.CHANNEL) {
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
	    }else{
    		logger.log(`No attachment and no !wins command message from ${message.author.username}`);
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
		if(imgScore < 10000 && imgScore > 0){
				message.react('🍴');
	    	message.react('🐔');
				message.react('🏆');
	    	let users = getMessageUsers(message);
	    	let res = await logUserWins(message, users, false);
				let embed = formatDinnerCountResponse(res, imgScore);
				sendDiscordMessage(message, embed, true);
				logger.log(`Compare score looks good (${imgScore}), awarding win.`);
  		}else{
  			logger.log(`Compare score out of range (${imgScore}), no win for you!`);
  			message.reply(`I see you uploaded an image but it doesn\'t look like a PUBG win to me...\n\nNO WIN FOR YOU! :clap:\n\n_Image compare score: ${imgScore.toLocaleString()}_`);
  		}
	}catch(err){
		logger.log('app.js::Error fetching score, is the uploaded image size a problem?');
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
	embed.setThumbnail('https://peterfiorella.com/img/DinnerBot/dinner.png');
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
			return {username: messageUser.username, wins: undefined};
		}
	}));
}

async function logUserWins(message, users, lowConf){
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