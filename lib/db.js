const Sequelize = require('sequelize');
let sequelize;
const logger = require('./log.js');
let CONFIG;

if(process.env.NODE_ENV === 'DOCKER'){
	CONFIG = require('/config/config');
}else{
	CONFIG = require('../config');
}

const UserModel = require('./models/user');
const MessageModel = require('./models/message');
const HashModel = require('./models/hash');

logger.debug(`Using local SQLite: DB path: ${CONFIG.db.DATABASE_PATH}`);
if(process.env.NODE_ENV === 'test'){
	sequelize = new Sequelize("sqlite::memory:");
}else{
	sequelize = new Sequelize(undefined, undefined, undefined, {
		dialect: 'sqlite',
		storage: CONFIG.db.DATABASE_PATH,
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