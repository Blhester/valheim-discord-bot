const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const exec = require('child_process').exec;

const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages]});

const commandPrefix = '!';
const serverLocation = '/home/pi/valheim_server/';

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

    if(command === 'restart_server') {
        let pidOfServer;
        exec('pidof valheim_server.x86_64', (error, stdout, stderr) => {
            if (error != null)  {
                sendMessage(message, 'Unable to find the status of the server. The server must be offline');
                executeStartScript(message); 
            } else if (stdout !== null) {
                executeStartScript(message);
	        }	 
        });
    }

    if(command === 'status') {
        let pidOfServer;
        exec('pidof valheim_server.x86_64', (error, stdout, stderr) => {
            if (error != null)  {
                sendMessage(message, 'Unable to find the status of the server. The server must be offline'); 
            } else if (stdout !== null) {
                pidOfServer = stdout.toString().trim().replace('ELAPSED', '');
                exec(`ps -p ${pidOfServer} -o etime`, (error, stdout) => {
                    if(error != null) {
                        sendMessage(message, 'Unable to find the status of the server. The server must be offline');
                    } else {
                        sendMessage(message, 'Server is online and has been for ' + stdout.toString());	
                    }
                });
	        }	 
        });
    };
});

function executeStartScript(message) {
    exec(`${serverLocation}./start_server.sh & | disown`, (error, stdout) => {
        if (error != null) {
            sendMessage(message, 'Something went wrong when trying to start the server.');
        } else {
            sendMessage(message, 'Server is now booting up');
        }
    });
}

function sendMessage(message, messageToSend) {
    message.channel.send({embeds: [new EmbedBuilder().setDescription(messageToSend).setAuthor({
        name: message.author.username,
        iconURL: message.author.defaultAvatarURL,
    }).setColor('Gold')]});
}

client.login('MTA2MjU5Mzc5NTc3NjA2MTQ2MA.GYUH2C.FZDkLgGYUhpTiHxQl_PtBW_wKQU3LgHqRTJhVE');
