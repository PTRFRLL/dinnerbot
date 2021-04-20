const path = require('path');
const logger = require('./log')('DB');
const Sequelize = require('sequelize');
const UserModel = require('./models/user');
const MessageModel = require('./models/message');
const HashModel = require('./models/hash');

let DATA_PATH = process.env.DATA_PATH || "/data";
const DATABASE_PATH = path.join(DATA_PATH, 'dinnerbot.sqlite');

logger.debug(`DATABASE PATH: ${DATABASE_PATH}`);

let sequelize;
if(process.env.NODE_ENV === 'test'){
	sequelize = new Sequelize('sqlite::memory:', {
		logging: false
	});
}else{
	sequelize = new Sequelize(undefined, undefined, undefined, {
		dialect: 'sqlite',
		storage: DATABASE_PATH,
		logging: false
	});
}

const db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.user = UserModel(sequelize, Sequelize);
db.message = MessageModel(sequelize, Sequelize);
db.hash = HashModel(sequelize, Sequelize);

module.exports = db;