import { Message } from "discord.js";
import { Command, ExtendedClient } from "../../types";

const HelpCommand: Command = {
    name: 'help',
    description: 'List all of my commands or info about a specific command.',
    requiresAuth: false,
    args: false,
    argCount: null,
    requiresAPIKey: false,
    aliases: ['h'],
    usage: '[command name]',
    async execute(message: Message, args: Array<string>) {
        const data = [];
        const { commands } = message.client as ExtendedClient;
        
        if (!args.length) {
			data.push('Here\'s a list of all my commands:');
			data.push(`\`${commands.map(command => command.name).join(', ')}\``);
			data.push(`\nYou can send \`!help [command name]\` to get info on a specific command!`);

			return message.author.send(data, { split: true })
				.then(() => {
					if (message.channel.type === 'dm') return;
					message.reply('I\'ve sent you a DM with all my commands!');
				})
				.catch(error => {
					console.error(`Could not send help DM to ${message.author.tag}.\n`, error);
					message.reply('it seems like I can\'t DM you!');
				});
        }
        const name = args[0].toLowerCase();
		const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

		if (!command) {
            message.reply(`\`${name}\` is not a valid command!`);
            return;
		}

		data.push(`**Name:** ${command.name}`);
        if (command.requiresAuth) data.push(`**Requires Auth** 🔐 Only authorized users can use this command`)
		if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
		if (command.description) data.push(`**Description:** ${command.description}`);
		if (command.usage) data.push(`**Usage:** \`!${command.name} ${command.usage}\``);


		message.channel.send(data, { split: true });
    }
};

export default HelpCommand;