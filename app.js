require('dotenv').config()
const Discord = require('discord.js');
const fs = require('fs');
const db = require('./lib/db.js');
const logger = require('./lib/log.js');
const pkg = require('./package.json');
const {isAuth, notAuthResponse} = require('./lib/discord');

const {presenceUpdate} = require('./lib/events/presence');
const {botMentioned} = require('./lib/events/mention');
const {determineWin} = require('./lib/events/wins');
const {ALLOWED_EXT} = require('./lib/constants');

let prefix = process.env.COMMAND_PREFIX;
if(!prefix){
	prefix = "!";
	process.env.COMMAND_PREFIX = prefix;
}
const CHANNEL_ID = process.env.CHANNEL_ID;
const BOT_TOKEN = process.env.BOT_TOKEN;
const PUBG_API_KEY = process.env.PUBG_API_KEY;

try{
	if(!BOT_TOKEN || BOT_TOKEN === 'DISCORD_BOT_TOKEN' || BOT_TOKEN === ''){
		throw Error('❌ Discord bot token not provided');
	}
	if(!CHANNEL_ID || CHANNEL_ID === 'DISCORD_CHANNEL_ID' || CHANNEL_ID === ''){
		throw Error('❌ Discord channel ID not provided');
	}
}catch(e){
	logger.error(e.message);
	process.exit(1);
}

logger.info(`Starting dinnerbot (v${pkg.version})...`);
logger.debug(`Running in ${process.env.NODE_ENV} environment`);
logger.debug(`Command Prefix:    ${prefix}`);
logger.debug(`PUBG_API KEY:      ${PUBG_API_KEY ? 'Set' : 'Not Found'}`);
if(process.env.AUTH_USERS){
	logger.debug(`AUTH USERS:        ${process.env.AUTH_USERS}`);
}
if(process.env.AUTH_ROLES){
	logger.debug(`AUTH ROLES:        ${process.env.AUTH_ROLES}`);
}

const client = new Discord.Client();
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./lib/commands').filter(file => file.endsWith('.js'));

for(const file of commandFiles){
    const command = require(`./lib/commands/${file}`);
	if(command.requiresAPIKey && (!PUBG_API_KEY || PUBG_API_KEY === ''))
	{
		logger.info(`No PUBG API key provided, skipping command: ${command.name}`);
		continue;
	}
    client.commands.set(command.name, command);
}

logger.info(`✅ ${commandFiles.length} commands added: (${[ ...client.commands.keys()]})`);

//when we connect with Discord, sync with DB
client.on('ready', async() => {
	try{
		const serverID = client.guilds.cache.keys().next().value;
		const server = client.guilds.cache.get(serverID);
		logger.info(`✅ Connected to ${server.name}`);
		if(!client.channels.cache.has(CHANNEL_ID)){
			throw new Error(`❌ Discord channel ID ${CHANNEL_ID} not found on server ${server.name}`);
		}
		logger.info(`✅ Listening on #${client.channels.cache.get(CHANNEL_ID).name} (${CHANNEL_ID})`);
		await db.sequelize.sync();
		logger.info('✅ DB synced');
		logger.info('✅ Ready');
		client.user.setActivity(`for chicken dinners 🐔 DM ${prefix}help for commands. (v${pkg.version})`, {type: 'WATCHING'});
	}catch(err){
		logger.error(err.message);
		process.exit(1);
	}
});

//if we cannot connect to Discord, quit app
client.on('error', () => {
	logger.error(`❌ Error connecting to Discord, terminating...`);
	process.exit(1);
});

client.on('disconnect', () => {
	logger.info(`Disconnecting from Discord...`);
});

client.on('reconnecting', () => {
	logger.info(`Attempting to reconnect...`);
});

client.on('message', async (message) => {
	try{
		//if message isn't DM to bot or on proper channel (or from a bot), ignore it
		if (message.author.bot || (message.channel.type !== 'dm' && message.channel.id !== CHANNEL_ID)) return;

		//check for screenshot
		let attachment = message.attachments.first();
		if (attachment){
			//don't allow chicken dinner screenshots in DMs
			if(message.channel.type === 'dm'){
				return message.reply(`I can't award wins here, post in <#${CHANNEL_ID}> instead 👍`);
			}
			logger.info(`Attachment found from ${message.author.username}`);
			logger.info(`Filename: ${attachment.name}`);
			if(!ALLOWED_EXT.includes(attachment.name.split('.').pop().toLowerCase())){
				logger.info('Extension not allowed, skipping...');
				return;
			}
			await determineWin(attachment.proxyURL, message);
			return;
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
		}

		logger.info(`${command.name} command requested by ${message.author.username}`);

		//check if user is authorized to run command
		if(command.requiresAuth)
		{
			if(message.channel.type === 'dm'){
				return message.reply(`I can't check your server role in DMs, try again in <#${CHANNEL_ID}> instead 👍`);
			}
			if(!isAuth(message)){
				return notAuthResponse(message);
			}
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

//login to Discord
client.login(BOT_TOKEN);

module.exports.client = client;