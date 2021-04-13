# Dinnerbot - PUBG Win Tracker

> Celebrate and record your PUBG chicken dinners!

[![Publish Docker image](https://github.com/PTRFRLL/dinnerbot/workflows/Publish%20Docker%20image/badge.svg)](https://github.com/PTRFRLL/dinnerbot/actions/workflows/main.yml)
[![Run tests](https://github.com/PTRFRLL/dinnerbot/actions/workflows/node.yml/badge.svg)](https://github.com/PTRFRLL/dinnerbot/actions/workflows/node.yml)
![GitHub last commit](https://img.shields.io/github/last-commit/PTRFRLL/dinnerbot.svg)
[![Discord Status](https://discordapp.com/api/guilds/144143242928193537/embed.png)](https://discord.gg)

![Dinner Bot](examples/winner.gif)

Dinnerbot is a PUBG Discord companion bot that tracks wins, lists PUBG stats and celebrates your chicken dinners 🥳

- Monitors a channel for winning screenshots and responds with **WINNER WINNER CHICKEN DINNER** and some emoji 🐔 🏆 🍽
- Watches Discord presence to proactively alert user of win and post winning match stats
- Tracks wins for each user
- Queries PUBG API for stats

## Commands

### !wins

Use `!wins` command to see current win count, you can tag users to show their count as well.

Ex. `!wins @DericLee @Tarvis` produces:

![Win Count](examples/wins.png)

### !help

Use `!help` or mention the bot to get a list of available commands

![Help](examples/help.png)

## PUBG Stats

The bot can query the PUBG API for stats from the last win and lifetime stats. You'll need to get a [PUBG API Key](https://developer.pubg.com/) and add it via the `PUBG_API_KEY` environment variable/config file

![stats](examples/stats.png)

## Winning Screenshots

### Image Comparison

Winning screenshots are determined by comparing the uploaded screenshot with a known win screenshot ([base.png](./data/img/base.png)). If the uploaded screenshot is within a certain similarity score to the base image, a win is awarded.

If the uploaded image is not within the specified threshold, the image will be OCRed and the bot looks for the text **"WINNER WINNER CHICKEN DINNER"**

### Image Hash

When a winning screenshot is added, dinnerbot will compute the SHA1 hash of the uploaded image and store it in the database. This is used to avoid someone uploading duplicate images.

![Hash](examples/dupe.png)

## Getting Started

### Create Bot in Discord Dev portal

Create a new dev app on Discord [here](https://discordapp.com/developers/applications/me).

Under the Bot section, click Add Bot and copy your bot's Token.

**Presence Intent**

If you want dinnerbot to alert when it detects a win via Discord presence, be sure to enable Presence Intent under the Privileged Gateway Intents on the Bot section

![presence](examples/presence.png)

Add the bot to your server using [bot authorization flow](https://discordapp.com/developers/docs/topics/oauth2#bots):

Example link (note CLIENT_ID != TOKEN):

```
https://discordapp.com/api/oauth2/authorize?client_id=CLIENT_ID&scope=bot&permissions=75840
```

### Docker

The simplest way to run dinnerbot. You need to map the `/config` and `/data` volumes in order for it to run

```
docker pull ptrfrll/dinnerbot:latest
docker run -d -e BOT_TOKEN="BOT_TOKEN" -e CHANNEL_ID="CHANNEL_ID" -e PUBG_API_KEY="PUBG_API_KEY" -e DATABASE_PATH="/data/db.sqlite" -v path_on_local_machine:/data:rw -v path_on_local_machine:/config:rw ptrfrll/dinnerbot
```

Example:

```
docker run -d --name dinnerbot \
-e BOT_TOKEN="FAKETOKEN1234" \
-e CHANNEL_ID="1234567890" \
-e PUBG_API_KEY="abc123" \
-e DATABASE_PATH="/data/db.sqlite" \
-v C:\Users\ptrfrll\dinnerbot\data:/data:rw \
-v C:\Users\ptrfrll\dinnerbot\config:/config:rw \
ptrfrll/dinnerbot
```

### Run locally

Edit the [config.json](./config/config.json) file with your discord bot token and the channel-id of the channel you want the bot to monitor

Start the bot with:

```
$ npm install
$ npm run dev
```

## Configuration

The following environment variables change be changed/set. If running locally, modify the [config.json](./config/config.json) file to change these settings.

| Name              | Description                                                                       | Required | Default |
| ----------------- | --------------------------------------------------------------------------------- | -------- | ------- |
| DISCORD_BOT_TOKEN | Discord Bot Token                                                                 | ✔        |         |
| DISCORD_CHANNEL   | ID of Discord channel that bot monitors                                           | ✔        |         |
| DATABASE_PATH     | Path to DB file                                                                   | ✔        |         |
| COMMAND_PREFIX    | What character to prefix a bot command (e.g. !help)                               |          | !       |
| LOGMODE           | Logging mode (prod or debug)                                                      |          | prod    |
| AUTH_USERS        | Comma delimited list of Discord user Ids that can preform authorized commands     |          |         |
| AUTH_ROLES        | Comma delimited list of Discord server roles that can preform authorized commands |          |         |
| PUBG_API_KEY      | PUBG API key used for stat lookup                                                 |          |         |

## Built With

- [Discord.js](https://discord.js.org/#/) - Javascript library for Discord API
- [Moment.js](https://momentjs.com/) - Javascript Date Library
- [Sequelize](http://docs.sequelizejs.com/) - ORM
- [Axios](https://github.com/axios/axios) - Promise based HTTP client
