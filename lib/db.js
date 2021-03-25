const Sequelize = require('sequelize');
let sequelize;
const logger = require('./log.js');
const CONFIG = require('../config.js');

const UserModel = require('./models/user');
const MessageModel = require('./models/message');
const HashModel = require('./models/hash');

logger.debug(`Using local SQLite: DB path: ${CONFIG.db.DATABASE_PATH}`);
sequelize = new Sequelize(undefined, undefined, undefined, {
	dialect: 'sqlite',
	storage: CONFIG.db.DATABASE_PATH,
	logging: false
});

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.user = UserModel(sequelize, Sequelize);
db.message = MessageModel(sequelize, Sequelize);
db.hash = HashModel(sequelize, Sequelize);

module.exports = db;