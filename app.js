const Discord = require('discord.js');
const fs = require('fs');
const db = require('./lib/db.js');
const logger = require('./lib/log.js');
const bot = require('./lib/discord');
const CONFIG = require('./config');
const package = require('./package.json');
const {isAuth, notAuthResponse} = require('./lib/discord');

const {presenceUpdate} = require('./lib/events/presence');
const {botMentioned} = require('./lib/events/mention');
const {checkScore} = require('./lib/events/wins');



const client = new Discord.Client();
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./lib/commands').filter(file => file.endsWith('.js'));

for(const file of commandFiles){
    const command = require(`./lib/commands/${file}`);
    client.commands.set(command.name, command);
}
logger.log(`✅ ${commandFiles.length} commands added: (${[ ...client.commands.keys()]})`);

//when we connect with Discord, sync with DB
client.on('ready', () => {
	let serverID = client.guilds.cache.keys().next().value;
	logger.debug('Running in debug mode...');
	logger.log(`✅ Connected to ${client.guilds.cache.get(serverID).name}`);
	logger.log(`✅ Listening on #${client.channels.cache.get(CONFIG.app.DISCORD_CHANNEL).name}`);
	db.sequelize.sync().then(function() {
		logger.log('✅ DB synced');
		client.user.setActivity(`for chicken dinners 🐔 (v${package.version})`, {type: 'WATCHING'});
	}).catch((e) => {
		logger.error('❌ Error connecting to DB');
		logger.error(e);
		process.exit(1);
	});
});

//if we cannot connect to Discord, quit app
client.on('error', () => {
	logger.error(`❌ Error connecting to Discord, terminating...`);
	process.exit(1);
});

client.on('disconnect', () => {
	logger.log(`Disconnecting from Discord...`);
});

client.on('reconnecting', () => {
	logger.log(`Attempting to reconnect...`);
});

const prefix = CONFIG.app.COMMAND_PREFIX;
client.on('message', async (message) => {
	try{
		//if message isn't DM to bot or on proper channel (or from a bot), ignore it
		if (message.author.bot || (message.channel.type !== 'dm' && message.channel.id !== CONFIG.app.DISCORD_CHANNEL)) return;

		//check for screenshot
		let attachment = message.attachments.first();
		if (attachment){
			//don't allow chicken dinner screenshots in DMs
			if(message.channel.type === 'dm'){
				return message.reply(`I can't award wins here, post in <#${CONFIG.app.DISCORD_CHANNEL}> instead 👍`);
			}
			logger.log(`Attachment found from ${message.author.username}`);
			logger.log(`Filename: ${attachment.name}`);
			if(!CONFIG.app.ALLOWED_EXT.includes(attachment.name.split('.').pop().toLowerCase())){
				logger.log('Extension not allowed, skipping...');
				return;
			}
			return await checkScore(attachment.proxyURL, message);
		}

		const args = message.content.slice(prefix.length).trim().split(/ +/);
		const commandName = args.shift().toLowerCase();

		const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

		if(!command){
			if(message.mentions.has(client.user)){
				botMentioned(message, client);
			}else{
				logger.debug(`No command found: ${commandName}`);
				logger.debug(`Command: ${commandName}`);
				logger.debug(`Args: ${args}`);
			}
			return;
		};

		logger.log(`Command ${command.name} requested by ${message.author.username}`);

		//check if user is authorized to run command
		if(command.requiresAuth && !isAuth(message))
		{
			return notAuthResponse(message);
		}
		
		if(command.args && (!args.length || args.length < command.argCount)){
			let reply = `You didn't provide enough arguments, ${message.author}!`;
			if(command.usage){
				reply += `\nThe proper usage would be:\n\`${prefix}${command.name} ${command.usage}\``
			}
			return message.channel.send(reply);
		}
    
        command.execute(message, args);
    }catch(err){
        logger.error('❌');
        logger.error(err);
        message.react('☠');
    }
})

client.on('presenceUpdate', presenceUpdate);



try{
	if(!CONFIG.app.DISCORD_BOT_TOKEN || CONFIG.app.DISCORD_BOT_TOKEN === 'DISCORD_BOT_TOKEN' || CONFIG.app.DISCORD_BOT_TOKEN === ''){
		throw Error('Discord bot token not provided in config.js');
	}
	if(!CONFIG.app.DISCORD_CHANNEL || CONFIG.app.DISCORD_CHANNEL === 'DISCORD_CHANNEL_ID' || CONFIG.app.DISCORD_CHANNEL === ''){
		throw Error('Discord channel ID not provided in config.js');
	}
}catch(e){
	logger.error(e.message);
	process.exit(1);
}
//login to Discord
client.login(CONFIG.app.DISCORD_BOT_TOKEN);

module.exports.client = client;