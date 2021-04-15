const path = require('path');
const Sequelize = require('sequelize');
const logger = require('./log');
const UserModel = require('./models/user');
const MessageModel = require('./models/message');
const HashModel = require('./models/hash');

let DATABASE_PATH = process.env.DATABASE_PATH || "./data/dinnerbot.sqlite";
if(!DATABASE_PATH){
	throw new Error('Database Path not provided');
}

DATABASE_PATH = path.normalize(DATABASE_PATH)
logger.debug(`DATABASE PATH: ${DATABASE_PATH}`);

let sequelize = new Sequelize(undefined, undefined, undefined, {
	dialect: 'sqlite',
	storage: DATABASE_PATH,
	logging: false
});

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.user = UserModel(sequelize, Sequelize);
db.message = MessageModel(sequelize, Sequelize);
db.hash = HashModel(sequelize, Sequelize);

module.exports = db;