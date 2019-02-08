module.exports = function(sequelize, DataTypes) {
	return sequelize.define('Message', {
	  message_id:DataTypes.STRING,
	  score: DataTypes.INTEGER
	});
};