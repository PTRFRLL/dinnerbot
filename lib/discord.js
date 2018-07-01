require('dotenv').config();
const _ = require('lodash');
const db = require('./db');
const score = require('./score');
const logger = require('./log');


module.exports.onMessage = onMessage;

function onMessage(message){
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
    		checkScore(attachment.url, message);
	    }else if(message.content.includes('!wins')){
	    	logger.log(`Wins requested by ${message.author.username}`);
	    	let users = getMessageUsers(message);
    		getWins(message, users);
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
  	}else if(message.channel.id === process.env.TESTCHANNEL){
  		//testing channel
  		if(message.content.includes('!wins')){
	    	logger.log(`Wins requested by ${message.author.username}`);
	    	let users = getMessageUsers(message);
    		getWins(message, users);
    	}else{
    		if(message.author.id !== '347124235237457920'){
    			logger.log(`No attachment and no !wins command message from ${message.author.username}`);
	    		if(message.embeds.length > 0){
	    			logger.log(`Embed detected, checking for URL`);
	    			let got = message.embeds[0];
	    			if(got.url){
	    				logger.log(`URL detected, checking for wins`);
	    				checkScore(got.url, message);
	    			}
	    		}else{
	    			logger.debug(`No embeds? embeds.length: ${message.embeds.length}`);
	    			console.log(message.embeds);
	    		}
    		}
    	}
  	}
}


async function checkScore(url, message){
	try{
		let score = await score.getScore(url);
		if(score < 10000 && score > 0){
				message.react('🍴');
	    	message.react('🐔');
	    	let users = getMessageUsers(message);
	    	logUserWins(message, users, false);
				logger.log(`Compare score looks good (${score}), awarding win.`);
  		}else{
  			logger.log(`Compare score out of range, no win for you!`);
  			message.channel.send(`I see you uploaded an image but it doesn\'t look like a PUBG win to me...\n\nNO WIN FOR YOU!\n\nCompare score: ${score}`);
  		}
	}catch(err){
		logger.log('app.js::Error fetching score, dumb mode engaged');
		message.react('🍴');
		message.react('🐔');
		let users = getMessageUsers(message);
		logUserWins(message, users, true);
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


function formatDinnerCountResponse(users, lowConf){
	let embed = new Discord.RichEmbed();
	embed.setTitle("Chicken Dinner Count [Beta]");
	embed.setDescription('PUBG wins counted by this bot for each tagged user.');
	embed.setColor('RANDOM');
	embed.setThumbnail('https://peterfiorella.com/img/DinnerBot/dinner.png');
	users.forEach(user => {
		if(!user.wins){
			embed.addField(user.username, 'N/A', true);
		}else{
			embed.addField(user.username, user.wins, true);
		}
	});
	if(lowConf){
		embed.setFooter('No comparison score, could be anything...');
	}
	return embed;
}

function sendDiscordMessage(message, embed, isWinner){
	if(isWinner) message.channel.send('WINNER WINNER CHICKEN DINNER!');
	message.channel.send({embed});
}

function getWins(message, users){
	let dbCalls = [];
	//loop through mentioned users and increment wins OR create them in DB to start tracking
	for(let i = 0; i < users.length; i++){
		let messageUser = users[i];
		//call db increment, get wins for each user
		dbCalls.push(db.user.findOne({
			where: {
				discord_id: messageUser.id
			}
		}).then(function(user){
			if(user){
				return user;
			} else{
				return {username: messageUser.username, wins: undefined};
			}
		}, function(){
			//error on where
		}).then(res => {
			return res;
		})
		);
	}// end loop

	//respond with wins
	Promise.all(dbCalls).then(res =>{
		let embed = formatDinnerCountResponse(res);
		sendDiscordMessage(message, embed, false);
	});
}

function logUserWins(message, users, lowConf){
	let dbCalls = [];
	//loop through mentioned users and increment wins OR create them in DB to start tracking
	for(let i = 0; i < users.length; i++){
		let messageUser = users[i];
		//call db increment, get wins for each user
		dbCalls.push(db.user.findOne({
			where: {
				discord_id: messageUser.id
			}
		}).then(function(user){
			if(user){
				if(!config.debugMode){
					return user.increment('wins').then((user) => {
						logger.log(`${messageUser.username} found, incrementing wins...`);
						return user.reload();
					});
				}
			} else{
				//user wasn't found, create them
				logger.log(`${messageUser.username} was not found, creating user...`);
				if(!config.debugMode){
					return db.user.create({
						username: messageUser.username,
						discord_id: messageUser.id,
						wins: 1
					}).then(function(user){
						return user;
					});
				}
			}
		}, function(){
			//error on where
		}).then(res => {
			return res;
		})
		);
	}// end loop

	//respond with wins
	Promise.all(dbCalls).then(res =>{
		let embed = formatDinnerCountResponse(res, lowConf);
		sendDiscordMessage(message, embed, true);
	});
}
