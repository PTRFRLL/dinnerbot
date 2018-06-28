# DinnerBot

![Dinner Bot](https://peterfiorella.com/img/DinnerBot/main.png)

Discord bot that listens on a specfic channel for PUBG win screenshots and responds with emoji and WINNER WINNER CHICKEN DINNER if image is within a certain similarity to a base image (this avoids false positives when someone uploads any image). Useful for `chicken-dinner-receipt` channels where only winning screenshots are posted. Keeps track of win count for each tagged users. 

Use `!wins` command to see current win count, you can tag users to show their count as well.

Ex. `!wins @Dirka @tgruenen24` produces: 

![Win Count](https://peterfiorella.com/img/DinnerBot/wins.png)

## Getting Started

Create a new dev app on Discord [here](https://discordapp.com/developers/applications/me).

Edit the .env.example file with the channel-id and client-app secret. 

Add the bot to your server using this url (replace CLIENT_ID with your bots):

```
https://discordapp.com/oauth2/authorize?client_id=CLIENT_ID&scope=bot&permissions=0
```

Start the bot with:

```
$ node app.js
```

## Built With

* [Discord.js](https://discord.js.org/#/) - Javascript library for Discord API
* [Moment.js](https://momentjs.com/) - Javascript Date Library
* [dotenv](https://github.com/motdotla/dotenv) - Loads environment variables from .env
* [Pixelmatch](https://github.com/mapbox/pixelmatch) - pixel-level image comparison library
* [Sequelize](http://docs.sequelizejs.com/) - ORM
* [Sharp](https://github.com/lovell/sharp) - Image Processing
* [Axios](https://github.com/axios/axios) - Promise based HTTP client