# valheim-discord-bot

A simple bot that controls a steam dedicated server.

# Startup
If you haven't installed the most recent dependencies or this is the first time startup then run this.
> npm install

Then run
> npm run-script run

To run headles in Linux (requires nohup package)
> nohup run-script run &

To use sh file that runs it headless
> ./run_bot.sh

# Config
Add the location and name of your server startup script (note to make sure your start script runs it in headless mode), output.log location, and your discord bot secret.
