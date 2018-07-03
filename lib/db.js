var Sequelize = require('sequelize');
var sequelize;
require('dotenv').config();
const MODE = process.env.MODE;

let path = __dirname + '/../data/users.sqlite'
if(MODE == 'debug'){
	path = __dirname + '/../data/test.sqlite'
}

const Op = Sequelize.Op;
sequelize = new Sequelize(undefined, undefined, undefined, {
	dialect: 'sqlite',
	storage: path,
	logging: false,
	operatorsAliases: Op
});


var db = {};

db.user = sequelize.import(__dirname + '/models/user.js');
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;