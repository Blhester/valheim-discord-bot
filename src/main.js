import { CommandTypes } from './assets/CommandType.js';
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { exec } from 'child_process';
import { execFile } from 'child_process';
import Config from 'config';
const { get } = Config;

//These are the bot configs being brought in from the default.json file
const commandPrefix = Config.get('bot.commandPrefix');
const botSecret = Config.get('bot.secret');
const generalChannel = Config.get('bot.channels.general');

//These are the server configs being brought in from the default.json file
const serverLocation = Config.get('server.serverLocation');
const serverProcessName = Config.get('server.serverProcessName');
const serverExecutableName = Config.get('server.serverExecutableName');
const outputLogFilename = Config.get('server.outputLogFilename');

const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers]});
var timeOfLastRestart;

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
    if(!message.content.startsWith(commandPrefix) 
    || message.author.bot 
    || message.channel.name !== 'valheim-bot') return;
    
    const args = message.content.slice(commandPrefix.length).split(/ +/);
    const command = args.shift().toLowerCase();
    let possibleCommands = '';
    
    var allCommands = Object.values(CommandTypes);
    allCommands.forEach(command => {
            possibleCommands=`${possibleCommands}!${command}\n`
    });
    
    console.log(`Got command ${command}`);
    switch(command) {
        case CommandTypes.PING: {
            sendMessage(message, 'pong');
            break;
        }

        case CommandTypes.ECHO: {
            const embed = new EmbedBuilder()
            .setAuthor({
                name: message.author.username,
                iconURL: message.author.avatarURL({ dynamic:true }),
            })
            .setDescription(`@everyone ${message.content.slice(commandPrefix.length + command.length)}`)
            .setColor('Gold');
    
            sendEmbedToChannel(embed);
            break;
        }

        case CommandTypes.NUMBER_OF_PLAYERS: {
            exec(`cat ${serverLocation}${outputLogFilename} | egrep -o "Connections [0-9]{1,2}" | tail -1 | egrep -o "[0-9]{1,2}"`, (error, stdout) => {
                if(error !== null) {
                    sendMessage(message, `There was an error trying to find the number of players on the server`);
                    console.log(error.toString());
                } else if (stdout !== null) {
                    numberOfPlayersOnServer = stdout.toString().trim();
                    sendMessage(message, `There are currently ${numberOfPlayersOnServer} player(s) on the server`);
                }
               }).unref();
               break; 
        }

        case CommandTypes.STOP_SERVER: {
            let pidOfServer;
            exec(`pidof -s ${serverProcessName}`, (error, stdout) => {
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
                    }).unref();
                }	 
            }).unref();
            break;
        }

        case CommandTypes.START_SERVER: {
            exec(`pidof -s ${serverProcessName}`, (error, stdout) => {
                if (error !== null)  {
                    sendMessage(message, 'Attempting to bring the server online. Type !status for details');
                    timeOfLastRestart = new Date(Date.now());
                    executeStartScript(message); 
                } else if (stdout !== null) {
                    sendMessage(message, 'Server is currently online already, please !stop_server first.');
                }	 
            }).unref();
            break;
        }

        case CommandTypes.STATUS: {
            let pidOfServer;
            exec(`pidof -s ${serverProcessName}`, (error, stdout) => {
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
                                    let timeOfServerBootInLogs = new Date(stdout.toString().trim().slice(0, 18));
                                    if (timeOfLastRestart === null) {
                                        console.log(`Time of lastRestart is null`);
                                        timeOfLastRestart = timeOfServerBootInLogs;
                                    }
                                    console.log(`Time of ${timeOfServerBootInLogs}`)
                                    if (timeOfLastRestart > timeOfServerBootInLogs) {
                                        sendMessage(message, 'Server is still booting back up');
                                    } else {
                                        timeOfLastRestart = timeOfServerBootInLogs;
                                        sendMessage(message, `Server has been online since ${timeOfServerBootInLogs.toString()}`);	
                                    }
                                }
                            }).unref()
                        }
                    }).unref();
                }	 
            }).unref();
            break;
        }

        case CommandTypes.HELP: {
            sendMessage(message, `Here is the list of possible commands:\n${possibleCommands}`);
            break;
        }

        default: {
            sendMessage(message, `${command} is not a valid command. Type !help to get all valid commands`);
            break;
        }
    }
});

function executeStartScript(message) {
    execFile(`${serverLocation}./${serverExecutableName}`, (error, stdout, stderr) => {
        if (error !== null) {
            sendMessage(message, 'There was an error when trying to start the server');
            console.log(error.toString());
        } else if (stderr != null) {
            sendMessage(message, 'There was an error when trying to start the server');
            console.log(stderr.toString());
        } else {
            sendMessage(message, 'Starting Server!')
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
    client.channels.fetch(generalChannel).then(channel => channel.send({embeds: [embed]}));
}
client.login(botSecret);
