const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const exec = require('child_process').exec;
const execFile = require('child_process').execFile;

const commandPrefix = '!';
const serverLocation = '/home/pi/valheim_server/';

const config = require('config');
const botSecret = config.get('bot.secret');

const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers]});
let timeOfLastRestart;

client.once('ready', () => {
    console.log('Valorant Bot is online!');
});

client.on('guildMemberAdd', (member) => {
    const embed = new EmbedBuilder()
    .setAuthor({
        name: `Hello, ${member.user.username}`,
        iconURL: member.user.displayAvatarURL({ dynamic:true }),
    })
    .setTitle('Welcome!')
    .setDescription(`${member} has joined the server.`)
    .setFooter({text: 'Checkout the sticky in general for the server information. https://discordapp.com/channels/1062472969701560380/1064934406080430180/1064934471662567444',})
    .setColor('Gold');

    sendEmbedToChannel(embed);
});

client.on('messageCreate', (message) => {
    if(!message.content.startsWith(commandPrefix) || message.author.bot || message.channel.name !== 'valheim-bot') return;
    console.log(`Got command ${message.content}`);
    const args = message.content.slice(commandPrefix.length).split(/ +/);
    const command = args.shift().toLowerCase();

    if(command === 'ping') {
        sendMessage(message, 'pong');
    }

    if(command.startsWith('echo')) {
        const embed = new EmbedBuilder()
        .setAuthor({
            name: 'Hello, ' + message.channel.name,
            iconURL: message.author.avatarURL({ dynamic:true }),
        })
        .setTitle('Echo')
        .setDescription(`${message.author.username} said "${message.content.slice(commandPrefix.length + command.length)}"`)
        .setColor('Gold');

        sendEmbedToChannel(embed);
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
        }).unref();
    }

    if(command === 'status') {
        let pidOfServer;
        exec('pidof -s valheim_server.x86_64', (error, stdout, stderr) => {
            if (error !== null)  {
                sendMessage(message, 'Unable to find the status of the server. The server must be offline');
                console.log(error.toString()); 
            } else if (stdout !== null) {
                pidOfServer = stdout.toString().trim();
                exec(`ps -p ${pidOfServer} -o etime | egrep '[0-9]{1,2}:[0-9]{1,2}'`, (error, stdout) => {
                    if(error !== null) {
                        sendMessage(message, 'Unable to find the status of the server. The server must be offline');
                        console.log(error.toString());
                    } else if (stdout !== null) {
                        exec(`cat ${serverLocation}output.log | grep "Load world:" | tail -1`, (error, stdout) => {
                            if(error !== null) {
                                console.log(error.toString());                        
                            } else if (stdout !== null) {
                                let timeOfServerBootInLogs = Date.parse(stdout.toString().trim().slice(0, 18));
                                if (timeOfLastRestart === null) {
                                    timeOfLastRestart = timeOfServerBootInLogs;
                                }
                                console.log(`Time of ${timeOfServerBootInLogs}`)
                                if (timeOfLastRestart > timeOfServerBootInLogs) {
                                    sendMessage(message, 'Server is still booting back up');
                                } else {
                                    let timeSinceRestart = Date.now().getMinutes() - timeOfServerBootInLogs.getMinutes();
                                    sendMessage(message, `Server is online and has been for ${timeSinceRestart/60} minutes`);	
                                }
                            }
                        })
                    }
                });
	        }	 
        });
    };

    if(command === 'stop_server') {
        let pidOfServer;
        exec('pidof -s valheim_server.x86_64', (error, stdout, stderr) => {
            if (error !== null)  {
                sendMessage(message, 'Unable to find the status of the server. The server must be offline');
                console.log(error.toString()); 
            } else if (stdout !== null) {
                pidOfServer = stdout.toString().trim();
                exec(`sudo kill -9 ${pidOfServer}`, (error, stdout) => {
                    if(error !== null) {
                        sendMessage(message, 'Error when trying to kill the server');
                        console.log(error.toString());
                    } else if (stdout !== null) {
                        sendMessage(message, 'Server has been shut down');
                    }
                });
	        }	 
        });
    }
});

function executeStartScript(message) {
    execFile(`${serverLocation}./start_server.sh`, (error, stdout, stderr) => {
        if (error !== null) {
            sendMessage(message, 'There was an error when trying to start the server');
            console.log(error.toString());
        } else if (stderr != null) {
            sendMessage(message, 'There was an error when trying to start the server');
            console.log(stderr.toString());
        } else {
            sendMessage(message, 'Starting Server!')
            timeOfLastRestart = Date.now();
            console.log(stdout.toString());
        } 
    }).unref();
}

function sendMessage(message, messageToSend) {

    message.channel.send({embeds: [new EmbedBuilder().setDescription(messageToSend).setAuthor({
        name: 'Hello, ' + message.author.username,
        iconURL: message.author.avatarURL({ dynamic:true }),
    }).setColor('Gold')]});
}


function sendEmbedToChannel(embed) {
    client.channels.fetch('1064934406080430180').then(channel => channel.send({embeds: [embed]}));
}
client.login(botSecret);
