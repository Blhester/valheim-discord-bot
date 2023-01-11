const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');


const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages]});

const commandPrefix = '!';

client.once('ready', () => {
    console.log('Valorant Bot is online!');
});

client.on('messageCreate', (message) => {
    console.log(`Got message ${message.content}`);
    if(!message.content.startsWith(commandPrefix) || message.author.bot) return;

    const args = message.content.slice(commandPrefix.length).split(/ +/);
    const command = args.shift().toLowerCase();

    if(command === 'ping') {
        message.channel.send({embeds: [new EmbedBuilder().setDescription('pong').setAuthor({
            name: message.author.username,
            iconURL: message.author.defaultAvatarURL,
        }).setColor('Gold')]});
    }
});

client.login('MTA2MjU5Mzc5NTc3NjA2MTQ2MA.GzrxMf.Fxt-Uib2ntpjLsLOymVqFwVV41QOAjDqV2ltYE');

