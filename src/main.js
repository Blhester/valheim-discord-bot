const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const exec = require('child_process').exec;

const commandPrefix = '!';
const serverLocation = '/home/pi/valheim_server/';

const config = require('config');
const botSecret = config.get('bot.secret');

const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages]});

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
        exec('pidof -s valheim_server.x86_64', (error, stdout, stderr) => {
            if (error !== null)  {
                sendMessage(message, 'Server is offline, attempting to boot up server');
                executeStartScript(message); 
            } else if (stdout !== null) {
                pidOfServer = stdout.toString().trim();
                exec(`sudo kill -9 ${pidOfServer}`, (error, stdout) => {
                    if(error !== null) {
                        sendMessage(message, 'Error when trying to kill the server');
                        console.log(error.toString());
                    } else {
                        executeStartScript(message);
                    }
                });
	        }	 
        });
    }

    if(command === 'status') {
        let pidOfServer;
        exec('pidof -s valheim_server.x86_64', (error, stdout, stderr) => {
            if (error !== null)  {
                sendMessage(message, 'Unable to find the status of the server. The server must be offline');
                console.log(error.toString()); 
            } else if (stdout !== null) {
                pidOfServer = stdout.toString().trim();
                exec(`ps -p ${pidOfServer} -o etime`, (error, stdout) => {
                    if(error !== null) {
                        sendMessage(message, 'Unable to find the status of the server. The server must be offline');
                        console.log(error.toString());
                    } else {
                        sendMessage(message, 'Server is online and has been for ' + stdout.toString());	
                    }
                });
	        }	 
        });
    };
});

function executeStartScript(message) {
    exec(`${serverLocation}./start_server.sh`, (error, stdout, stderr) => {
        if (error !== null) {
            sendMessage(message, 'There was an error when trying to start the server');
            console.log(error.toString());
        } else if (stdout !== null) {

        }
    });
}

function sendMessage(message, messageToSend) {
    message.channel.send({embeds: [new EmbedBuilder().setDescription(messageToSend).setAuthor({
        name: message.author.username,
        iconURL: message.author.defaultAvatarURL,
    }).setColor('Gold')]});
}

client.login(botSecret);
