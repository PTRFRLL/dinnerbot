var Sequelize = require('sequelize');
var env = process.env.NODE_ENV || 'development';
var sequelize;


sequelize = new Sequelize(undefined, undefined, undefined, {
	dialect: 'sqlite',
	storage: '/home/peter/node-discord-bot/data/users.sqlite',
	logging: false
});


var db = {};

db.user = sequelize.import(__dirname + '/models/user.js');
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;