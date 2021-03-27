export const HashModel = (sequelize, DataTypes) => {
	return sequelize.define('Hash', {
	  message_id: DataTypes.STRING,
	  hash: DataTypes.STRING,
	  username: DataTypes.STRING
	});
};