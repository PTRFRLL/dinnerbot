import { Message } from 'discord.js';
import { Command } from '../../types';
import {getMessageUsers, sendWins} from '../discord';

const WinsCommand: Command = {
    name: 'wins',
    description: 'Get PUBG wins counted by this bot for each tagged user.',
    requiresAuth: false,
    requiresAPIKey: false,
    args: false,
    argCount: null,
    aliases: ['w'],
    usage: '@SomeUser',
	async execute(message: Message, args: Array<string>) {
        let users = await getMessageUsers(message);
        await sendWins(users, message);
	}
};

export default WinsCommand;