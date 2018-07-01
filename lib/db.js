var Sequelize = require('sequelize');
var sequelize;
require('dotenv').config();
const MODE = process.env.MODE;

let path = '/home/peter/node-discord-bot/data/users.sqlite'
if(MODE == 'debug'){
	path = '/home/peter/node-discord-bot/data/test.sqlite'
}

sequelize = new Sequelize(undefined, undefined, undefined, {
	dialect: 'sqlite',
	storage: path,
	logging: false
});


var db = {};

db.user = sequelize.import(__dirname + '/models/user.js');
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;