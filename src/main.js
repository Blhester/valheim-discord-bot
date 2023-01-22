import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { exec } from 'child_process';
import { execFile } from 'child_process';
import Config from 'config';
import { getLastStartTimeOfServerInLogs, processIsRunning } from './assets/server_controller.js';

//These are the bot configs being brought in from the default.json file
const botSecret = Config.get('bot.secret');
const commandPrefix = Config.get('bot.commandPrefix');
const commands = Config.get('bot.commands');
const generalChannel = Config.get('bot.channels.general');
const serverControlRolls = Config.get('bot.serverControlRolls');

//These are the server configs being brought in from the default.json file
const serverLocation = Config.get('server.serverLocation');
const serverProcessName = Config.get('server.serverProcessName');
const serverExecutableName = Config.get('server.serverExecutableName');
const outputLogFilename = Config.get('server.outputLogFilename');

const client = new Client({intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.MessageContent, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.GuildMembers]});
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
    if(!message.content.startsWith(commandPrefix) || message.author.bot) return;
    
    const args = message.content.slice(commandPrefix.length).split(/ +/);
    const command = args.shift().toLowerCase();
    let possibleCommands = '';
    
    Object.values(commands).forEach(command => {
            possibleCommands=`${possibleCommands}!${command}\n`
    });
    
    console.log(`Got command ${command}`);
    switch(command) {
        case commands.get('HELP'): {
            sendMessage(message, `Here is the list of possible commands:\n${possibleCommands}`);
            break;
        }

        case commands.get('PING'): {
            sendMessage(message, 'pong');
            break;
        }

        case commands.get('ECHO'): {
            const embed = new EmbedBuilder()
            .setAuthor({
                name: message.author.username,
                iconURL: message.author.avatarURL({ dynamic:true }),
            })
            .setDescription(`@everyone ${message.content.slice(commandPrefix.length + command.length)}`)
            .setColor('Gold');
            checkMemberRolesForServerControl(message, () => sendEmbedToChannel(embed));
            break;
        }

        case commands.get('NUMBER_OF_PLAYERS'): {
            exec(`cat ${serverLocation}${outputLogFilename} | egrep -o "Connections [0-9]{1,2}" | tail -1 | egrep -o "[0-9]{1,2}"`, 
            (error, stdout) => {
                if(error !== null) {
                    sendMessage(message, `There was an error trying to find the number of players on the server`);
                    console.log(error.toString());
                } else if (stdout !== null) {
                    let numberOfPlayersOnServer = stdout.toString().trim();
                    sendMessage(message, `There are currently ${numberOfPlayersOnServer} player(s) on the server`);
                }
               }).unref();
               break; 
        }
        
        case commands.get('STOP_SERVER'): {
            checkMemberRolesForServerControl(message, () => stopServer(message));
            break;  
        } 
        

        case commands.get('START_SERVER'): {
            if (processIsRunning(serverProcessName)) {
                sendMessage(message, 'Server is currently online already, please !stop_server first.');
            } else {
                sendMessage(message, 'Attempting to bring the server online. Type !status for details');
                timeOfLastRestart = new Date(Date.now());
                executeStartScript(message); 
            }
            break;
        }

        case commands.get('STATUS'): {
            if (processIsRunning(serverProcessName)) {
                let timeOfServerBootInLogs = new Date(getLastStartTimeOfServerInLogs(`${serverLocation}${outputLogFilename}`));
                if (timeOfLastRestart === null) {
                    console.log(`Time of lastRestart is null`);
                    timeOfLastRestart = timeOfServerBootInLogs;
                }
                
                if (timeOfLastRestart > timeOfServerBootInLogs) {
                    sendMessage(message, 'Server is still booting back up');
                } else {
                    timeOfLastRestart = timeOfServerBootInLogs;
                    sendMessage(message, `Server has been online since ${timeOfServerBootInLogs.toString()}`);	
                }          
            } else {
                sendMessage(message, `Server is offline`);
            }   
            break;      
        }
    

        case commands.get('ROLL'): {
            var maxValueToRoll = new Number(args[0]);
            var rolledValue = Math.floor(Math.random() * maxValueToRoll);
            sendMessage(message, `You rolled a ${rolledValue}`);
            break;
        }

        case commands.get('ROCK'):
        case commands.get('PAPER'):
        case commands.get('SCISSORS'): {
            let array = ['rock', 'paper', 'scissors'];

            var botsValue = array[Math.floor(Math.random() * 3)];
            let playerWins = checkIfPlayerWins(command, botsValue);

            if (playerWins === null) {
                sendMessage(message, `I played ${botsValue}, we tied!`);
            } else if (playerWins) {
                sendMessage(message, `I played ${botsValue}, you win!`);
            } else {
                sendMessage(message, `I played ${botsValue}, you lose!`);
            }
        }

        default: {
            sendMessage(message, `${command} is not a valid command. Type !help to get all valid commands`);
            break;
        }
    }
});

function stopServer(message) {
    exec(`pidof -s ${serverProcessName}`, (error, stdout) => {
        if (error !== null) {
            sendMessage(message, 'Unable to find the status of the server. The server must be offline');
            console.log(error.toString());
        } else if (stdout !== null) {
            exec(`sudo kill -9 ${stdout.toString().trim()}`, (error, stdout) => {
                if (error !== null) {
                    sendMessage(message, 'Error when trying to kill the server');
                    console.log(error.toString());
                } else if (stdout !== null) {
                    sendMessage(message, 'Server has been shut down');
                }
            }).unref();
        }
    }).unref();
}

function executeStartScript(message) {
    execFile(`${serverLocation}./${serverExecutableName}`, (error, stdout) => {
        if (error !== null) {
            sendMessage(message, 'There was an error when trying to start the server');
            console.log(error.toString());
        } else if (stdout !== null) {
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

function checkMemberRolesForServerControl(message, fn) {
    if (message.member.roles.cache.some(role => serverControlRolls.includes(role.name))) {
        fn();
    } else {
        sendMessage(message, `Sorry, you don't have permission for that command`);
    }
}

function checkIfPlayerWins(command, botsValue) {
    if (command === null ||
        botsValue === null ||
        command === botsValue) return null;

    switch(command) {
        case 'rock': {
            return botsValue === 'paper' ? false : true;
        }
        case 'paper': {
            return botsValue === 'scissors' ? false : true;
        }
        case 'scissors': {
            return botsValue === 'rock' ? false : true;
        }
        default : {
            return null;
        }
    }
}

client.login(botSecret);
