var Sequelize = require('sequelize');
var sequelize;
const logger = require('./log.js');
const CONFIG = require('../config.js');

logger.debug(`Using local SQLite: DB path: ${CONFIG.db.DATABASE_PATH}`);
sequelize = new Sequelize(undefined, undefined, undefined, {
	dialect: 'sqlite',
	storage: CONFIG.db.DATABASE_PATH,
	logging: false
});

var db = {};

db.user = sequelize.import(__dirname + '/models/user.js');
db.message = sequelize.import(__dirname + '/models/message.js');
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;