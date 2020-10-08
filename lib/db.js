const Sequelize = require('sequelize');
const UserModel = require(__dirname + '/models/user.js');
const MessageModel = require(__dirname + '/models/message.js');
const HashModel = require(__dirname + '/models/hash.js');
const logger = require('./log.js');
const CONFIG = require('../config.js');

logger.debug(`Using local SQLite: DB path: ${CONFIG.db.DATABASE_PATH}`);
const sequelize = new Sequelize(undefined, undefined, undefined, {
	dialect: 'sqlite',
	storage: CONFIG.db.DATABASE_PATH,
	logging: false
});

const User = UserModel(sequelize, Sequelize);
const Hash = HashModel(sequelize, Sequelize);
const Message = MessageModel(sequelize, Sequelize);
const db = {
	sequelize,
	Sequelize,
	User,
	Hash,
	Message
};

module.exports = db;