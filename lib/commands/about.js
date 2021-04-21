const pkg = require('../../package.json');
const Discord = require("discord.js");

module.exports = {
    name: 'about',
    description: 'About yours truly',
    requiresAuth: false,
    aliases: ['version'],
    usage: '',
	async execute(message, args) {
        const embed = new Discord.MessageEmbed();
        embed.setTitle(`${pkg.name} (v${pkg.version})`);
        embed.setDescription('A little PUBG Discord bot.\n\n\DM `!help\` to get started');
        embed.setColor('RANDOM');
        embed.setFooter(`By @${pkg.author}`);
        embed.setURL(pkg.homepage);
        embed.setThumbnail('https://peterfiorella.com/img/DinnerBot/dinner.png')
		message.channel.send(embed);
	}
}