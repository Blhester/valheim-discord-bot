const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const exec = require('child_process').exec;

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
        sendMessage(message, 'pong');
    }

    if(command === 'status') {
        let pidOfServer;
        exec('pidof valheim_server.x86_64', (error, stdout, stderr) => {
            if (error != null)  {
                sendMessage(message, 'Unable to find the status of the server. The server must be offline'); 
            } else if (stdout !== null) {
		pidOfServer = stdout.toString().trim();
		exec(`ps -p ${pidOfServer} -o etime`, (error, stdout) => {
			if(error != null) {
			  sendMessage(message, 'Unable to find the status of the server. The server must be offline');
			} else {
			  sendMessage(message, stdout.toString());	
			}
		});
	      }	 
            }
        });
    }
});

function sendMessage(message, messageToSend) {
    message.channel.send({embeds: [new EmbedBuilder().setDescription(messageToSend).setAuthor({
        name: message.author.username,
        iconURL: message.author.defaultAvatarURL,
    }).setColor('Gold')]});
}

client.login('MTA2MjU5Mzc5NTc3NjA2MTQ2MA.GYUH2C.FZDkLgGYUhpTiHxQl_PtBW_wKQU3LgHqRTJhVE');
