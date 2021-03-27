import { Client, Collection, Message } from "discord.js";

export class ExtendedClient extends Client {
    public commands: Collection<string, Command>;
}

export class Command{
    name: string;
    description: string;
    usage: string;
    args: boolean;
    argCount: number | null;
    requiresAuth: boolean;
    requiresAPIKey: boolean | null;
    aliases: Array<string>;
    execute(message: Message, args: Array<string>): Promise<void>;
}