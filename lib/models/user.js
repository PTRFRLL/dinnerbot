module.exports = function(sequelize, DataTypes) {
	return sequelize.define('User', {
	  username: DataTypes.STRING,
	  discord_id:DataTypes.STRING,
	  wins: DataTypes.INTEGER,
	  pubg_username: DataTypes.STRING,
	  pubg_id: DataTypes.STRING
	});
};