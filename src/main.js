const { Client, GatewayIntentBits, EmbedBuilder, RichEmbed } = require('discord.js');
const exec = require('child_process').exec;
const execFile = require('child_process').execFile;

const commandPrefix = '!';
const serverLocation = '/home/pi/valheim_server/';

const config = require('config');
const botSecret = config.get('bot.secret');

const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers]});

client.once('ready', () => {
    console.log('Valorant Bot is online!');
});

client.on('guildMemberAdd', (member) => {
    const embed = new RichEmbed()
    .setAuthor(member.user.tag, member.user.displayAvatarURL)
    .setTitle('Welcome!')
    .setDescription(`${member} has joined the server.`)
    .setFooter('Checkout the sticky in general for the server information.\nhttps://discordapp.com/channels/1062472969701560380/1062921919122391103/1063277885776986153')
    .setColor('Gold');

    sendEmbedToChannel('general', embed);
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
        const embed = new RichEmbed()
        .setAuthor(message.author.username, message.author.avatarURL({ dynamic:true }))
        .setTitle('Test Method (Echo)')
        .setDescription(`${message.author.username} said "${command.substring(6)}"`)
        .setFooter('End Of Method.')
        .setColor('Gold');

        sendEmbedToChannel('general', embed);
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
                        sendMessage(message, 'Server is online and has been for ' + stdout.toString().trim());	
                    }
                });
	        }	 
        });
    };
});

function executeStartScript(message) {
    execFile(`${serverLocation}./start_server.sh`, (error, stdout, stderr) => {
        if (error !== null) {
            sendMessage(message, 'There was an error when trying to start the server');
            console.log(error.toString());
        } else if (stdout !== null) {
            sendMessage(message, 'Starting server!');
            console.log(stdout.toString());
        } else if (stderr != null) {
            console.log(stderr.toString());
        }
    }).unref();
}

function sendMessage(message, messageToSend) {

    message.channel.send({embeds: [new EmbedBuilder().setDescription(messageToSend).setAuthor({
        name: 'Hello, ' + message.author.username,
        iconURL: message.author.avatarURL({ dynamic:true }),
    }).setColor('Gold')]});
}


function sendEmbedToChannel(channelName, embed) {
    message.channel.find((channel) => channel.name.toLowerCase() === channelName).send({embed});
}

client.login(botSecret);
