require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const _ = require('lodash');
var db = require('./lib/db.js');
var score = require('./lib/score.js');
var logger = require('./lib/log.js');


const config = {
	shouldCheckImageComparison: true, //compare uploaded screenshot with base image to determine similarity score
	debugMode: false //won't increment db stats if set to true
};

//when we connect with Discord, sync with DB
client.on('ready', () => {
	logger.log('Connected and listening...');
	db.sequelize.sync().then(function() {
		logger.log('DB synced...');
	});
});

client.on('message', message => {
	//if message was posted in the channel we want
  	if (message.channel.id === process.env.CHANNEL) {
  		//grab the first attachment (could be undefined)
	    var attachment = message.attachments.first();
	    //if there is an attachment
	    if(attachment){
	    	logger.log(`Attachment found from ${message.author.username}`);
	    	logger.log(`Filename: ${attachment.filename}`);
    		score.getScoreAsync(attachment.url).then(score => {
    			if(config.shouldCheckImageComparison){
    				if(score < 10000 && score > 0){
	    				message.react('🍴');
				    	message.react('🐔');
				    	let users = getMessageUsers(message);
				    	logUserWins(message, users);
	    				logger.log(`Compare score looks good, awarding win.`);
		    		}else{
		    			logger.log(`Compare score out of range, no win for you!`);
		    			message.channel.send(`I see you uploaded an image but it doesn\'t look like a PUBG win to me...\n\nNO WIN FOR YOU!\n\nCompare score: ${score}`);
		    		}
    			}else{
    				message.react('🍴');
			    	message.react('🐔');
			    	let users = getMessageUsers(message);
			    	logUserWins(message, users);
    			}
    		}).catch(err => {
    			logger.log('app.js::Error fetching score, dumb mode engaged');
    			message.react('🍴');
		    	message.react('🐔');
		    	let users = getMessageUsers(message);
		    	logUserWins(message, users);
    		});
	    }else if(message.content.includes('!wins')){
	    	logger.log(`Wins requested by ${message.author.username}`);
	    	let users = getMessageUsers(message);
    		getWins(message, users);
	    }
  	}
});

client.login(process.env.SECRET);

function getMessageUsers(message){
	let users = [];
	let author = {
		username: message.author.username,
		id: message.author.id
	};
	users.push(author);

	var mentions = message.mentions.users;
	mentions.forEach(user => {
		users.push({username: user.username, id: user.id});
	});
	//make array unique by ID (if author is tagged, remove dupe)
	users = _.uniqBy(users, 'id');
	logger.log(`Found the following users`);
	console.log(users);
	return users;
}


function formatDinnerCountResponse(users){
	let embed = new Discord.RichEmbed();
	embed.setTitle("Chicken Dinner Count [Beta]");
	embed.setDescription('PUBG wins counted by this bot for each tagged user.');
	embed.setColor('RED');
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

function logUserWins(message, users){
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
		let embed = formatDinnerCountResponse(res);
		sendDiscordMessage(message, embed, true);
	});
}